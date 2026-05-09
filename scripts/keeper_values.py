"""
S13 Keeper Values calculator.

Logic:
- Universe = each player on a S12 week-17 roster (final roster).
- For each player, find chain origin = most recent chain-starting event
  (draft pick with is_keeper=0/NULL, or transaction add via Waiver/Free Agent).
- chain_origin_round: drafted round if origin=draft, else 18.
- times_kept_in_chain = 12 - origin_season (season boundaries crossed within chain).
- S13 keeper year = times_kept_in_chain + 1.
- Cost progression applied iteratively from base round:
    year 1: -1, year 2: -2, year 3: -3, year 4: -5, year 5: -8 (Fibonacci added to last year's round)
- Cost capped at round 1 and flagged.
"""

import sqlite3
import csv
import json
import os
import sys

DB = "public/PotIsDefeated.db"
OUT_CSV = os.path.expanduser("~/Desktop/keeper_values_S13.csv")
OUT_JSON = "public/keeper_values_S13.json"

# Cost decrement schedules (subtract from previous year's round)
# Draft chains: year 1 = base - 1, then standard pattern
# Waiver chains: year 1 stays at base (R18, no decrement), then standard pattern from year 2
DECREMENTS_DRAFT  = {1: 1, 2: 2, 3: 3, 4: 5, 5: 8}
DECREMENTS_WAIVER = {1: 0, 2: 2, 3: 3, 4: 5, 5: 8}


def get_decrement(year_n, origin_type):
    """Return decrement for year_n (1-indexed) given chain origin type."""
    table = DECREMENTS_WAIVER if origin_type in ("waiver", "free_agent") else DECREMENTS_DRAFT
    return table.get(year_n, 8 + (year_n - 5))


# Backwards-compat alias used elsewhere in the script
DECREMENTS = DECREMENTS_DRAFT


def keeper_cost(base_round, origin_season, origin_type="draft", current_season=12, target_season=13):
    """
    Walk the chain forward from origin_season to target_season, applying the
    appropriate decrement schedule each season-boundary keep.
    Returns (last_year_kept_round, target_year_cost, capped, next_year_n).
    """
    rnd = base_round
    capped = False
    for n, _season in enumerate(range(origin_season + 1, current_season + 1), start=1):
        dec = get_decrement(n, origin_type)
        rnd = rnd - dec
        if rnd < 1:
            rnd = 1
            capped = True
    last_year_kept_round = rnd

    next_year_n = (current_season - origin_season) + 1
    next_dec = get_decrement(next_year_n, origin_type)
    target_round = last_year_kept_round - next_dec
    if target_round < 1:
        target_round = 1
        capped = True
    return last_year_kept_round, target_round, capped, next_year_n


def main():
    if not os.path.exists(DB):
        print(f"ERROR: db not found at {DB}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1. S12 final roster (week 17)
    s12_final = cur.execute("""
        SELECT owner, name, position, team, player_id, sleeper_id
        FROM rosters
        WHERE season=12 AND week=17
        ORDER BY owner, name
    """).fetchall()

    # 2. All chain-starting events for these players
    # Build a map: player_id -> list of events (sort_key, season, origin_type, base_round, origin_owner, detail)
    s12_player_ids = set(r["player_id"] for r in s12_final if r["player_id"] is not None)

    events = {}  # player_id -> list of (sort_key, season, origin_type, base_round, origin_owner, detail)

    # Draft is_keeper=0 (or NULL pre-S6) — chain-starting
    for row in cur.execute("""
        SELECT CAST(player_id AS TEXT) as pid, season, round, owner, is_keeper
        FROM draft
        WHERE COALESCE(is_keeper, 0) = 0
    """):
        pid = row["pid"]
        if pid in s12_player_ids:
            sort_key = row["season"] * 100 + 0
            events.setdefault(pid, []).append(
                (sort_key, row["season"], "draft", row["round"], row["owner"], f"S{row['season']} draft R{row['round']}")
            )

    # Transaction adds — chain-starting (Waiver / Free Agent)
    for row in cur.execute("""
        SELECT player_id as pid, year, week, added, owner, transaction_date
        FROM transactions
    """):
        pid = row["pid"]
        if pid in s12_player_ids:
            season = row["year"] - 2013
            week = row["week"] or 0
            sort_key = season * 100 + week
            origin_type = "waiver" if row["added"] == "Waiver" else "free_agent"
            events.setdefault(pid, []).append(
                (sort_key, season, origin_type, 18, row["owner"], f"S{season} W{week} {row['added']}")
            )

    # 3. All trades for these players (used for acquired_via_trade flag and chain auditing)
    # Map roster_id -> owner per season via seasonSummary
    rid_owner = {}  # (season, roster_id) -> owner
    for row in cur.execute("SELECT season, owner, roster_id FROM seasonSummary"):
        try:
            rid_owner[(row["season"], int(row["roster_id"]))] = row["owner"]
        except (TypeError, ValueError):
            pass

    trades_for_player = {}  # player_id -> list of (season, week, sort_key, from_owner, to_owner, date)
    for row in cur.execute("""
        SELECT year, week, asset_id, from_roster_id, to_roster_id, trade_date
        FROM trades WHERE asset_type='player'
    """):
        pid = row["asset_id"]
        if pid not in s12_player_ids:
            continue
        season = row["year"] - 2013
        from_owner = rid_owner.get((season, row["from_roster_id"]))
        to_owner = rid_owner.get((season, row["to_roster_id"]))
        sort_key = season * 100 + (row["week"] or 0)
        trades_for_player.setdefault(pid, []).append(
            (sort_key, season, row["week"], from_owner, to_owner, row["trade_date"])
        )

    # 4. Get S12 draft round (for historical sanity check) per player
    s12_draft_round = {}
    s12_draft_owner = {}
    s12_draft_is_keeper = {}
    for row in cur.execute("SELECT CAST(player_id AS TEXT) as pid, round, owner, is_keeper FROM draft WHERE season=12"):
        s12_draft_round[row["pid"]] = row["round"]
        s12_draft_owner[row["pid"]] = row["owner"]
        s12_draft_is_keeper[row["pid"]] = row["is_keeper"]

    # 5. Look up dropped events by name (rough — drops are name-only)
    # Build a name->player_id map from rosters for players in our universe
    name_to_pid = {}
    for row in cur.execute("SELECT DISTINCT name, player_id FROM rosters WHERE player_id IS NOT NULL"):
        name_to_pid.setdefault(row["name"], set()).add(row["player_id"])

    drops_for_pid = {}
    for row in cur.execute("SELECT dropped, year, week, owner FROM transactions WHERE dropped IS NOT NULL AND dropped != ''"):
        nm = row["dropped"]
        season = row["year"] - 2013
        week = row["week"] or 0
        sort_key = season * 100 + week
        if nm in name_to_pid:
            for pid in name_to_pid[nm]:
                if pid in s12_player_ids:
                    drops_for_pid.setdefault(pid, []).append((sort_key, season, week, row["owner"]))

    # 5b. Build full event timeline per player for transaction-history modal display
    # Events: drafted, kept, added, dropped, traded
    timeline_for_pid = {}  # pid -> list of dicts

    for row in cur.execute("""
        SELECT CAST(player_id AS TEXT) as pid, season, year, round, owner, is_keeper,
               draft_slot, pick_no
        FROM draft
    """):
        pid = row["pid"]
        if pid not in s12_player_ids:
            continue
        season = row["season"]
        sort_key = season * 10000 + 0  # draft is week 0 of season
        kind = "kept" if row["is_keeper"] else "drafted"
        pick_label = f"R{row['round']}.{row['draft_slot']:02d}" if row["draft_slot"] else f"R{row['round']}"
        timeline_for_pid.setdefault(pid, []).append({
            "sort_key": sort_key,
            "season": season,
            "year": row["year"],
            "kind": kind,
            "owner": row["owner"],
            "detail": pick_label,
        })

    for row in cur.execute("""
        SELECT player_id as pid, year, week, owner, added, transaction_date
        FROM transactions
    """):
        pid = row["pid"]
        if pid not in s12_player_ids:
            continue
        season = row["year"] - 2013
        week = row["week"] or 0
        sort_key = season * 10000 + week * 10 + 1
        source = "Waivers" if row["added"] == "Waiver" else "Free Agency"
        timeline_for_pid.setdefault(pid, []).append({
            "sort_key": sort_key,
            "season": season,
            "year": row["year"],
            "week": week,
            "kind": "added",
            "owner": row["owner"],
            "detail": f"from {source}",
            "date": row["transaction_date"],
        })

    # Drops via name match (drops are recorded by name only)
    for row in cur.execute("""
        SELECT dropped, year, week, owner, transaction_date
        FROM transactions
        WHERE dropped IS NOT NULL AND dropped != ''
    """):
        nm = row["dropped"]
        if nm not in name_to_pid:
            continue
        season = row["year"] - 2013
        week = row["week"] or 0
        sort_key = season * 10000 + week * 10 + 0  # drop comes before paired add in same txn
        for pid in name_to_pid[nm]:
            if pid in s12_player_ids:
                timeline_for_pid.setdefault(pid, []).append({
                    "sort_key": sort_key,
                    "season": season,
                    "year": row["year"],
                    "week": week,
                    "kind": "dropped",
                    "owner": row["owner"],
                    "detail": "to draft pool",
                    "date": row["transaction_date"],
                })

    # Trades
    for row in cur.execute("""
        SELECT year, week, asset_id, from_roster_id, to_roster_id, trade_date
        FROM trades WHERE asset_type='player'
    """):
        pid = row["asset_id"]
        if pid not in s12_player_ids:
            continue
        season = row["year"] - 2013
        week = row["week"] or 0
        sort_key = season * 10000 + week * 10 + 2
        from_owner = rid_owner.get((season, row["from_roster_id"]))
        to_owner = rid_owner.get((season, row["to_roster_id"]))
        timeline_for_pid.setdefault(pid, []).append({
            "sort_key": sort_key,
            "season": season,
            "year": row["year"],
            "week": week,
            "kind": "traded",
            "owner": to_owner,
            "from_owner": from_owner,
            "detail": f"from {from_owner} to {to_owner}",
            "date": row["trade_date"],
        })

    # 6. Build keeper records
    rows_out = []
    review_flags = []
    for r in s12_final:
        pid = r["player_id"]
        evs = sorted(events.get(pid, []), reverse=True)  # most recent first
        if not evs:
            # No chain-starting event found — flag as unresolved
            rows_out.append({
                "current_owner": r["owner"],
                "player_name": r["name"],
                "position": r["position"],
                "nfl_team": r["team"],
                "chain_origin": "unknown",
                "original_base_round": "",
                "acquired_via_trade": "?",
                "times_kept_in_chain": "",
                "last_year_kept_round": "",
                "s13_keeper_cost_round": "",
                "notes": "NO chain-starting event found in data (pre-S6 draft or D/ST). Likely ineligible.",
            })
            review_flags.append(f"{r['owner']} - {r['name']}: no chain-starting event")
            continue

        sort_key, origin_season, origin_type, base_round, origin_owner, detail = evs[0]

        # times kept already (assuming clean chain — no drops between origin and S12 final)
        times_kept = 12 - origin_season

        # Formula-derived values (used for sanity check in notes)
        formula_last, formula_s13, formula_capped, _next_n = keeper_cost(base_round, origin_season, origin_type)

        # ANCHOR ON HISTORICAL S12 ROUND when chain origin predates S12 mid-season activity.
        # If chain origin is mid-S12 waiver/FA (sort_key > S12 draft), the historical S12 draft round
        # belongs to a NOW-BROKEN earlier chain — must use base=18 instead.
        hist_s12 = s12_draft_round.get(pid)
        S12_DRAFT_KEY = 12 * 100  # season 12, week 0 = draft event
        if sort_key <= S12_DRAFT_KEY and hist_s12 is not None:
            # Chain origin is at or before S12 draft; historical S12 round reflects the live chain
            last_round = hist_s12
        elif sort_key <= S12_DRAFT_KEY:
            # Chain origin is pre-S12 but no S12 draft entry — shouldn't happen for clean chains,
            # but fall back to formula
            last_round = formula_last
        else:
            # Chain origin is mid-S12 waiver/FA — historical S12 round (if any) belongs to broken chain
            last_round = 18

        # S13 cost = last_round - decrement for the upcoming keep year (rule depends on origin type)
        next_year_n = (12 - origin_season) + 1
        next_dec = get_decrement(next_year_n, origin_type)
        s13_round = last_round - next_dec
        capped = False
        if s13_round < 1:
            s13_round = 1
            capped = True

        # acquired_via_trade
        # current_owner != origin_owner OR there's a trade involving this player after origin where to_owner=current_owner
        trade_in_chain = False
        for tk in trades_for_player.get(pid, []):
            tk_sort = tk[0]
            if tk_sort >= sort_key and tk[4] == r["owner"]:
                trade_in_chain = True
                break
        acquired_via_trade = "Y" if (r["owner"] != origin_owner or trade_in_chain) else "N"

        eligible = not capped

        notes_parts = []
        if capped:
            notes_parts.append("NOT ELIGIBLE — formula falls below round 1")
        if times_kept >= 4:
            notes_parts.append(f"high-value: kept {times_kept} times")
        # historical vs formula sanity check (only meaningful when chain origin predates S12 mid-season)
        if sort_key <= S12_DRAFT_KEY and hist_s12 is not None and hist_s12 != formula_last:
            notes_parts.append(f"historical S12 R{hist_s12} differs from formula R{formula_last}")
        # pre-S6 origin (data gap): chains can't predate S6
        # Detect: if origin is S6 draft is_keeper=0, the chain might have actually started earlier
        if origin_season == 6 and origin_type == "draft":
            notes_parts.append("origin=S6 draft; pre-S6 history unavailable")
        # Drops within "chain" — would indicate data anomaly
        chain_drops = [d for d in drops_for_pid.get(pid, []) if d[0] > sort_key]
        if chain_drops:
            notes_parts.append(f"WARNING: {len(chain_drops)} drop event(s) in chain — chain may be broken")
            review_flags.append(f"{r['owner']} - {r['name']}: drops in chain: {chain_drops}")

        rows_out.append({
            "current_owner": r["owner"],
            "player_name": r["name"],
            "position": r["position"],
            "nfl_team": r["team"],
            "player_id": pid,
            "chain_origin": origin_type,
            "chain_origin_season": origin_season,
            "original_base_round": base_round,
            "acquired_via_trade": acquired_via_trade,
            "times_kept_in_chain": times_kept,
            "last_year_kept_round": last_round,
            "s13_keeper_cost_round": s13_round if eligible else None,
            "eligible": eligible,
            "notes": "; ".join(notes_parts),
            "timeline": sorted(timeline_for_pid.get(pid, []), key=lambda e: e["sort_key"]),
        })

    # Sort: by current_owner, then by s13_keeper_cost_round (low = more valuable first)
    def sort_key_fn(row):
        cost = row["s13_keeper_cost_round"]
        return (row["current_owner"], cost if isinstance(cost, int) else 999)

    rows_out.sort(key=sort_key_fn)

    # Write CSV (timeline excluded — JSON-only).
    # For ineligible players the cost column reads "NOT ELIGIBLE" rather than a number.
    csv_fields = [
        "current_owner", "player_name", "position", "nfl_team",
        "chain_origin", "original_base_round",
        "acquired_via_trade", "times_kept_in_chain",
        "last_year_kept_round", "s13_keeper_cost_round", "notes",
    ]
    with open(OUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        for r in rows_out:
            row = dict(r)
            if r.get("eligible") is False:
                row["s13_keeper_cost_round"] = "NOT ELIGIBLE"
            writer.writerow(row)

    print(f"Wrote {len(rows_out)} rows to {OUT_CSV}")

    # Write JSON for the website
    with open(OUT_JSON, "w") as f:
        json.dump({
            "generated_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
            "season": 13,
            "rows": rows_out,
        }, f, indent=2)
    print(f"Wrote {len(rows_out)} rows to {OUT_JSON}\n")

    # Summary by owner: top 5 keeper candidates
    print("=" * 70)
    print("TOP KEEPER CANDIDATES BY OWNER (sorted by S13 cost, lowest round = most $$)")
    print("=" * 70)
    by_owner = {}
    for r in rows_out:
        by_owner.setdefault(r["current_owner"], []).append(r)
    for owner in sorted(by_owner):
        roster = sorted(by_owner[owner], key=lambda x: x["s13_keeper_cost_round"] if isinstance(x["s13_keeper_cost_round"], int) else 999)
        print(f"\n{owner}:")
        for r in roster[:5]:
            cost = r["s13_keeper_cost_round"]
            cost_str = f"R{cost}" if isinstance(cost, int) else "INELIG"
            via = "(traded in)" if r["acquired_via_trade"] == "Y" else ""
            print(f"  {cost_str:<6} {r['player_name']:<28} {r['position']:<3} {r['nfl_team']:<4} kept={r['times_kept_in_chain']}x origin={r['chain_origin']} {via}")

    # Review flags
    print("\n" + "=" * 70)
    print("REVIEW THESE")
    print("=" * 70)
    review_rows = [r for r in rows_out if r["notes"]]
    for r in review_rows:
        cost = r["s13_keeper_cost_round"]
        cost_str = f"R{cost}" if isinstance(cost, int) else "INELIG"
        print(f"  [{r['current_owner']}] {r['player_name']} ({cost_str}): {r['notes']}")

    print(f"\nTotal players analyzed: {len(rows_out)}")
    print(f"Players flagged for review: {len(review_rows)}")


if __name__ == "__main__":
    main()

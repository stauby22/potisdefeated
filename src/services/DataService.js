/**
 * DataService — the single data access layer for all UI components.
 *
 * Season numbering: Season 1 = 2014, Season 12 = 2025.
 * year = season + 2013
 *
 * Special table: "old.seasonResults" — quoted because of the dot.
 *
 * Sleeper live integration: stubbed. All queries fall through to SQLite.
 * Wire up SleeperService for Season 13 when it starts.
 */

import { queryAll, queryOne } from './DatabaseService'

export const CURRENT_SEASON = 12
export const CURRENT_YEAR = 2025
export const LEAGUE_IDS = {
  11: '1119452826880638976',
  12: '1221297845672349697'
}

export const SEASON_YEAR = season => season + 2013
export const YEAR_SEASON = year => year - 2013

export const ACTIVE_OWNERS = [
  'Abe', 'Tom', 'Hunter', 'Matt', 'Blake',
  'Courtney', 'Dan', 'Asher', 'Dominic', 'Ethan'
]

export const ALL_OWNERS = [
  'Abe', 'Tom', 'Hunter', 'Matt', 'Blake', 'Courtney',
  'Dan', 'Asher', 'Dominic', 'Ethan', 'Mitch', 'Connor', 'Carl', 'Scott', 'Will'
]

const DataService = {

  // ─── Owners ─────────────────────────────────────────────────────────────────
  //
  // The `owners` table is a pre-computed aggregate that may not reflect the
  // latest season. weeklyResults is the source of truth for everything that
  // can be derived from game data:
  //   - championships  → match_type = 'championship' AND win = 1
  //   - total_wins/losses/PF/PA → all rows in weeklyResults
  // seasonSummary is used only for rank-based fields (best_rank, worst_rank,
  // seasons_played, last_season) since rank isn't in weeklyResults.
  // owners table kept only for: first_season, avg_draft_pos, current_team_name, sleeper_ids.

  getAllTimeStandings(db) {
    return queryAll(db, `
      SELECT
        o.owner,
        o.first_season,
        o.avg_draft_pos,
        o.current_team_name,
        o.sleeper_ids,
        COALESCE(champ.championships, 0)      AS championships,
        COALESCE(wr.total_wins, 0)            AS total_wins,
        COALESCE(wr.total_losses, 0)          AS total_losses,
        COALESCE(wr.total_points_for, 0)      AS total_points_for,
        COALESCE(wr.total_points_against, 0)  AS total_points_against,
        ROUND(
          CAST(COALESCE(wr.total_wins, 0) AS FLOAT) /
          NULLIF(COALESCE(wr.total_wins, 0) + COALESCE(wr.total_losses, 0), 0) * 100,
          1
        )                                     AS win_pct,
        COALESCE(ss_agg.seasons_played, 0)    AS seasons_played,
        ss_agg.best_rank,
        ss_agg.worst_rank,
        ss_agg.last_season
      FROM owners o
      LEFT JOIN (
        SELECT LOWER(team) AS lo, COUNT(*) AS championships
        FROM weeklyResults WHERE match_type = 'championship' AND win = 1
        GROUP BY LOWER(team)
      ) champ ON LOWER(o.owner) = champ.lo
      LEFT JOIN (
        SELECT LOWER(team) AS lo,
          SUM(win)                          AS total_wins,
          COUNT(*) - SUM(win)               AS total_losses,
          ROUND(SUM(points_for), 2)         AS total_points_for,
          ROUND(SUM(points_against), 2)     AS total_points_against
        FROM weeklyResults GROUP BY LOWER(team)
      ) wr ON LOWER(o.owner) = wr.lo
      LEFT JOIN (
        SELECT LOWER(owner) AS lo,
          COUNT(DISTINCT season) AS seasons_played,
          MIN(rank)              AS best_rank,
          MAX(rank)              AS worst_rank,
          MAX(season)            AS last_season
        FROM seasonSummary GROUP BY LOWER(owner)
      ) ss_agg ON LOWER(o.owner) = ss_agg.lo
      ORDER BY championships DESC,
               CAST(COALESCE(wr.total_wins, 0) AS FLOAT) /
               NULLIF(COALESCE(wr.total_wins, 0) + COALESCE(wr.total_losses, 0), 0) DESC
    `)
  },

  getOwner(db, ownerName) {
    return queryOne(db, `
      SELECT
        o.owner,
        o.first_season,
        o.avg_draft_pos,
        o.current_team_name,
        o.sleeper_ids,
        COALESCE(champ.championships, 0)      AS championships,
        COALESCE(wr.total_wins, 0)            AS total_wins,
        COALESCE(wr.total_losses, 0)          AS total_losses,
        COALESCE(wr.total_points_for, 0)      AS total_points_for,
        COALESCE(wr.total_points_against, 0)  AS total_points_against,
        COALESCE(ss_agg.seasons_played, 0)    AS seasons_played,
        ss_agg.best_rank,
        ss_agg.worst_rank,
        ss_agg.last_season
      FROM owners o
      LEFT JOIN (
        SELECT LOWER(team) AS lo, COUNT(*) AS championships
        FROM weeklyResults WHERE match_type = 'championship' AND win = 1
        GROUP BY LOWER(team)
      ) champ ON LOWER(o.owner) = champ.lo
      LEFT JOIN (
        SELECT LOWER(team) AS lo,
          SUM(win)                          AS total_wins,
          COUNT(*) - SUM(win)               AS total_losses,
          ROUND(SUM(points_for), 2)         AS total_points_for,
          ROUND(SUM(points_against), 2)     AS total_points_against
        FROM weeklyResults GROUP BY LOWER(team)
      ) wr ON LOWER(o.owner) = wr.lo
      LEFT JOIN (
        SELECT LOWER(owner) AS lo,
          COUNT(DISTINCT season) AS seasons_played,
          MIN(rank)              AS best_rank,
          MAX(rank)              AS worst_rank,
          MAX(season)            AS last_season
        FROM seasonSummary GROUP BY LOWER(owner)
      ) ss_agg ON LOWER(o.owner) = ss_agg.lo
      WHERE LOWER(o.owner) = LOWER(?)
    `, [ownerName])
  },

  getOwnerList(db) {
    return queryAll(db, `
      SELECT
        o.owner,
        o.first_season,
        o.current_team_name,
        COALESCE(champ.championships, 0)   AS championships,
        COALESCE(wr.total_wins, 0)         AS total_wins,
        COALESCE(wr.total_losses, 0)       AS total_losses,
        ROUND(
          CAST(COALESCE(wr.total_wins, 0) AS FLOAT) /
          NULLIF(COALESCE(wr.total_wins, 0) + COALESCE(wr.total_losses, 0), 0) * 100,
          1
        )                                  AS win_pct,
        ss_agg.last_season
      FROM owners o
      LEFT JOIN (
        SELECT LOWER(team) AS lo, COUNT(*) AS championships
        FROM weeklyResults WHERE match_type = 'championship' AND win = 1
        GROUP BY LOWER(team)
      ) champ ON LOWER(o.owner) = champ.lo
      LEFT JOIN (
        SELECT LOWER(team) AS lo,
          SUM(win) AS total_wins, COUNT(*) - SUM(win) AS total_losses
        FROM weeklyResults GROUP BY LOWER(team)
      ) wr ON LOWER(o.owner) = wr.lo
      LEFT JOIN (
        SELECT LOWER(owner) AS lo, MAX(season) AS last_season
        FROM seasonSummary GROUP BY LOWER(owner)
      ) ss_agg ON LOWER(o.owner) = ss_agg.lo
      ORDER BY championships DESC,
               CAST(COALESCE(wr.total_wins, 0) AS FLOAT) /
               NULLIF(COALESCE(wr.total_wins, 0) + COALESCE(wr.total_losses, 0), 0) DESC
    `)
  },

  // ─── Season results ─────────────────────────────────────────────────────────
  //
  // Data source strategy:
  //   PRIMARY   → seasonSummary  (complete for all 12 seasons, clean W/L/rank/PF/PA)
  //   SECONDARY → "old.seasonResults"  (extra fields: playoff_record, draft_grade,
  //               number_of_trades, number_of_moves, toilet_bowl_record, etc.)
  // We JOIN them so callers get a merged row. Column aliases preserve the names
  // that pages already expect (team = owner name, name = team name).

  getSeasonStandings(db, season) {
    return queryAll(db, `
      SELECT
        ss.season,
        ss.owner          AS team,
        ss.team_name      AS name,
        ss.wins,
        ss.losses,
        ss.rank,
        ss.points_for,
        ss.points_against,
        ss.high_score,
        ss.low_score,
        ss.roster_id,
        osr.draft_grade,
        osr.number_of_moves,
        osr.number_of_trades,
        osr.clinched_playoffs,
        osr.playoff_record,
        osr.playoff_wins,
        osr.playoff_losses,
        osr.playoff_points_for,
        osr.playoff_points_against,
        osr.toilet_bowl_record,
        osr.consolation_bowl_record
      FROM seasonSummary ss
      LEFT JOIN "old.seasonResults" osr
        ON ss.season = osr.season AND LOWER(ss.owner) = LOWER(osr.team)
      WHERE ss.season = ?
      ORDER BY ss.rank ASC
    `, [season])
  },

  getSeasonList(db) {
    // seasonSummary is authoritative for all 12 seasons
    const rows = queryAll(db, `SELECT DISTINCT season FROM seasonSummary ORDER BY season DESC`)
    return rows.map(r => r.season)
  },

  getOwnerSeasons(db, owner) {
    return queryAll(db, `
      SELECT
        ss.season,
        ss.owner          AS team,
        ss.team_name      AS name,
        ss.wins,
        ss.losses,
        ss.rank,
        ss.points_for,
        ss.points_against,
        ss.high_score,
        ss.low_score,
        osr.draft_grade,
        osr.number_of_trades,
        osr.number_of_moves,
        osr.playoff_record,
        osr.toilet_bowl_record
      FROM seasonSummary ss
      LEFT JOIN "old.seasonResults" osr
        ON ss.season = osr.season AND LOWER(ss.owner) = LOWER(osr.team)
      WHERE LOWER(ss.owner) = LOWER(?)
      ORDER BY ss.season ASC
    `, [owner])
  },

  getSeasonChampion(db, season) {
    return queryOne(db, `
      SELECT ss.owner AS team, ss.team_name AS name
      FROM seasonSummary ss
      WHERE ss.season = ? AND ss.rank = 1
    `, [season])
  },

  // ─── Weekly matchups ─────────────────────────────────────────────────────────

  getWeeklyMatchups(db, season, week) {
    return queryAll(db, `
      SELECT * FROM weeklyResults
      WHERE season = ? AND week = ?
      ORDER BY match_id, points_for DESC
    `, [season, week])
  },

  getSeasonWeeks(db, season) {
    const rows = queryAll(db, `
      SELECT DISTINCT week FROM weeklyResults WHERE season = ? ORDER BY week ASC
    `, [season])
    return rows.map(r => r.week)
  },

  getRecentMatchups(db, season, week) {
    return queryAll(db, `
      SELECT * FROM weeklyResults
      WHERE season = ? AND week = ?
      ORDER BY abs_margin DESC
    `, [season, week])
  },

  // ─── Head-to-head ────────────────────────────────────────────────────────────

  /** Full game log between two specific owners. */
  getH2H(db, owner1, owner2) {
    return queryAll(db, `
      SELECT * FROM weeklyResults
      WHERE (LOWER(team) = LOWER(?) AND LOWER(opponent) = LOWER(?))
         OR (LOWER(team) = LOWER(?) AND LOWER(opponent) = LOWER(?))
      ORDER BY season DESC, week DESC
    `, [owner1, owner2, owner2, owner1])
  },

  /** Aggregate H2H record for one owner vs all others. */
  getOwnerH2HMatrix(db, owner) {
    return queryAll(db, `
      SELECT
        opponent,
        SUM(win) as wins,
        COUNT(*) - SUM(win) as losses,
        ROUND(AVG(points_for), 2) as avg_pf,
        ROUND(AVG(points_against), 2) as avg_pa,
        ROUND(MAX(margin), 2) as biggest_win,
        ROUND(MIN(margin), 2) as biggest_loss
      FROM weeklyResults
      WHERE LOWER(team) = LOWER(?)
      GROUP BY opponent
      ORDER BY wins DESC
    `, [owner])
  },

  // ─── Owner career stats ──────────────────────────────────────────────────────

  getOwnerBiggestWins(db, owner, limit = 5) {
    return queryAll(db, `
      SELECT * FROM weeklyResults
      WHERE LOWER(team) = LOWER(?) AND win = 1
      ORDER BY margin DESC LIMIT ?
    `, [owner, limit])
  },

  getOwnerBiggestLosses(db, owner, limit = 5) {
    return queryAll(db, `
      SELECT * FROM weeklyResults
      WHERE LOWER(team) = LOWER(?) AND win = 0
      ORDER BY margin ASC LIMIT ?
    `, [owner, limit])
  },

  getOwnerResults(db, owner) {
    return queryAll(db, `
      SELECT season, week, win, points_for, points_against,
             opponent, match_type, date_of_match
      FROM weeklyResults
      WHERE LOWER(team) = LOWER(?)
      ORDER BY season ASC, week ASC
    `, [owner])
  },

  // ─── Draft ──────────────────────────────────────────────────────────────────

  getDraftForYear(db, year) {
    return queryAll(db, `
      SELECT * FROM draft WHERE year = ? ORDER BY pick_no ASC
    `, [year])
  },

  getOwnerDraftHistory(db, owner) {
    return queryAll(db, `
      SELECT * FROM draft WHERE LOWER(owner) = LOWER(?) ORDER BY year DESC, pick_no ASC
    `, [owner])
  },

  // ─── Records ────────────────────────────────────────────────────────────────

  getHighestSingleGameScores(db, limit = 10) {
    return queryAll(db, `
      SELECT team, opponent, season, week, points_for, points_against, win, match_type
      FROM weeklyResults
      ORDER BY points_for DESC LIMIT ?
    `, [limit])
  },

  getBiggestBlowouts(db, limit = 10) {
    return queryAll(db, `
      SELECT team, opponent, season, week, points_for, points_against, margin, match_type
      FROM weeklyResults WHERE win = 1
      ORDER BY margin DESC LIMIT ?
    `, [limit])
  },

  getClosestGames(db, limit = 10) {
    return queryAll(db, `
      SELECT team, opponent, season, week, points_for, points_against, abs_margin, match_type
      FROM weeklyResults WHERE win = 1
      ORDER BY abs_margin ASC LIMIT ?
    `, [limit])
  },

  getLowestWinningScores(db, limit = 10) {
    return queryAll(db, `
      SELECT team, opponent, season, week, points_for, points_against, match_type
      FROM weeklyResults WHERE win = 1
      ORDER BY points_for ASC LIMIT ?
    `, [limit])
  },

  getMostPointsInSeason(db, limit = 10) {
    return queryAll(db, `
      SELECT team, season, ROUND(SUM(points_for), 2) as total_pf, COUNT(*) as games
      FROM weeklyResults WHERE match_type = 'regular'
      GROUP BY team, season
      ORDER BY total_pf DESC LIMIT ?
    `, [limit])
  },

  getFewestPointsInSeason(db, limit = 10) {
    return queryAll(db, `
      SELECT team, season, ROUND(SUM(points_for), 2) as total_pf, COUNT(*) as games
      FROM weeklyResults WHERE match_type = 'regular'
      GROUP BY team, season
      ORDER BY total_pf ASC LIMIT ?
    `, [limit])
  },

  getChampionshipWins(db) {
    // weeklyResults is SOT: championship game winner = league champion
    return queryAll(db, `
      SELECT team AS owner, COUNT(*) AS championships
      FROM weeklyResults
      WHERE match_type = 'championship' AND win = 1
      GROUP BY team
      ORDER BY championships DESC
    `)
  },

  // ─── Trades ─────────────────────────────────────────────────────────────────

  getTrades(db) {
    return queryAll(db, `
      SELECT * FROM trades
      ORDER BY trade_date DESC, transaction_id ASC
    `)
  },

  getTradesByOwner(db, owner) {
    return queryAll(db, `
      SELECT * FROM trades
      WHERE LOWER(from_team_name) LIKE LOWER('%' || ? || '%')
         OR LOWER(to_team_name) LIKE LOWER('%' || ? || '%')
      ORDER BY trade_date DESC
    `, [owner, owner])
  },

  // ─── Rosters (use carefully — large table) ───────────────────────────────────

  getStartersForWeek(db, owner, season, week) {
    return queryAll(db, `
      SELECT name, position, points, team
      FROM rosters
      WHERE LOWER(owner) = LOWER(?) AND season = ? AND week = ?
        AND start = 'TRUE'
      ORDER BY points DESC
    `, [owner, season, week])
  },

  // ─── Transactions ────────────────────────────────────────────────────────────

  getTransactions(db, season) {
    const yearParam = SEASON_YEAR(season)
    return queryAll(db, `
      SELECT * FROM transactions WHERE year = ? ORDER BY week ASC, transaction_date ASC
    `, [yearParam])
  },

  // ─── Playoff / Consolation ───────────────────────────────────────────────────

  getPlayoffSummary(db, season) {
    return queryAll(db, `
      SELECT * FROM playoffSummary WHERE season = ?
    `, [season])
  },

  // ─── Quick home stats ────────────────────────────────────────────────────────

  getLeagueHighlights(db) {
    const totalGames = queryOne(db, `SELECT COUNT(*) as n FROM weeklyResults WHERE win = 1`)
    const highScore = queryOne(db, `
      SELECT team, season, week, points_for FROM weeklyResults ORDER BY points_for DESC LIMIT 1
    `)
    const closestGame = queryOne(db, `
      SELECT team, opponent, season, week, abs_margin FROM weeklyResults WHERE win = 1
      ORDER BY abs_margin ASC LIMIT 1
    `)
    return { totalGames: totalGames?.n, highScore, closestGame }
  }
}

export default DataService

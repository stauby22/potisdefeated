import { useEffect, useMemo } from 'react'
import { useDatabase } from '../../context/DatabaseContext'
import DataService, { SEASON_YEAR } from '../../services/DataService'

const POS_COLORS = {
  QB: '#c45050', RB: '#5fa05a', WR: '#4a85c4', TE: '#c4a850',
  K: '#8a8a8a', DEF: '#8a5a8a', DST: '#8a5a8a',
}

const ORIGIN_LABELS = {
  draft: 'Draft', waiver: 'Waiver', free_agent: 'Free Agent', unknown: 'Unknown',
}

const KIND_META = {
  drafted: { label: 'DRAFTED',  color: '#4a85c4' },
  kept:    { label: 'KEEPER',   color: '#a070c4' },
  added:   { label: 'ADDED',    color: '#5fa05a' },
  dropped: { label: 'DROPPED',  color: '#c45050' },
  traded:  { label: 'TRADED',   color: '#d4a843' },
}

/**
 * Reusable player modal. Two ways to feed it:
 *   <PlayerCard player={{ player_id, player_name, position, nfl_team, ... keeper fields ... }} />
 *      → "keeper context": shows keeper stat tiles using the precomputed fields
 *   <PlayerCard playerId="6794" />
 *      → "general context": looks up info & stats from the live DB
 */
export default function PlayerCard({ player, playerId, onClose }) {
  const { db } = useDatabase()

  // Resolve canonical player_id (allow either prop shape)
  const pid = player?.player_id ?? playerId
  const fallbackName = player?.player_name

  // Look up name/pos/team from DB if not provided
  const info = useMemo(() => {
    if (!db || !pid) return null
    if (player?.player_name) {
      return {
        name: player.player_name,
        position: player.position,
        team: player.nfl_team,
        player_id: pid,
      }
    }
    return DataService.getPlayerInfo(db, pid)
  }, [db, pid, player])

  const career = useMemo(() => (db && pid ? DataService.getPlayerCareer(db, pid) : []), [db, pid])
  const timeline = useMemo(() => (
    db && pid ? DataService.getPlayerTimeline(db, pid) : (player?.timeline ?? [])
  ), [db, pid, player])

  // Esc to close
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!pid) return null

  const totals = career.reduce((acc, r) => {
    acc.games += r.games_started || 0
    acc.points += Number(r.starter_points) || 0
    acc.weeks += r.roster_weeks || 0
    if (r.best_week > acc.best) acc.best = r.best_week
    return acc
  }, { games: 0, points: 0, weeks: 0, best: 0 })
  const ppg = totals.games > 0 ? (totals.points / totals.games).toFixed(1) : '—'

  const events = [...timeline].sort((a, b) => b.sort_key - a.sort_key)

  const isKeeperContext = !!player?.s13_keeper_cost_round || player?.eligible !== undefined

  const name = info?.name || fallbackName || `Player #${pid}`
  const position = info?.position || player?.position
  const team = info?.team || player?.nfl_team
  const posColor = POS_COLORS[position] || 'var(--cream-muted)'

  return (
    <div className="kp-modal-backdrop" onClick={onClose}>
      <div className="kp-modal" onClick={e => e.stopPropagation()}>
        <div className="kp-modal-header">
          <div>
            <div className="kp-modal-title">{name}</div>
            <div className="kp-modal-sub">
              <span style={{ color: posColor, fontWeight: 'bold' }}>{position || '—'}</span>
              {team && <> · {team}</>}
              {player?.current_owner && <> · currently rostered by <strong>{player.current_owner}</strong></>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="kp-modal-close" aria-label="Close">×</button>
        </div>

        {/* Stat tiles: keeper context shows S13 cost, general shows in-league career */}
        <div className="kp-modal-stats">
          {isKeeperContext ? (
            <>
              <Stat
                label="S13 Cost"
                value={player.eligible === false ? 'NOT ELIGIBLE' : `R${player.s13_keeper_cost_round}`}
                highlight={player.eligible !== false}
                danger={player.eligible === false}
              />
              <Stat label="Chain Origin" value={`${ORIGIN_LABELS[player.chain_origin] || player.chain_origin}${player.chain_origin_season ? ` · S${player.chain_origin_season}` : ''}`} />
              <Stat label="Times Kept" value={player.times_kept_in_chain ?? '—'} />
              <Stat label="S12 Round" value={`R${player.last_year_kept_round}`} />
            </>
          ) : (
            <>
              <Stat label="Seasons" value={career.length ? new Set(career.map(c => c.season)).size : 0} />
              <Stat label="Starts" value={totals.games} highlight />
              <Stat label="Avg PPG" value={ppg} />
              <Stat label="Best Week" value={totals.best ? totals.best.toFixed(1) : '—'} />
            </>
          )}
        </div>

        {player?.notes && (
          <div className="kp-modal-notes">
            <strong>Notes:</strong> {player.notes}
          </div>
        )}

        {/* Per-season league history */}
        {career.length > 0 && (
          <>
            <div className="kp-modal-section">IN-LEAGUE CAREER</div>
            <div className="kp-career-table">
              <div className="kp-career-row kp-career-head">
                <span>Season</span>
                <span>Manager</span>
                <span style={{ textAlign: 'right' }}>GS</span>
                <span style={{ textAlign: 'right' }}>Pts</span>
                <span style={{ textAlign: 'right' }}>PPG</span>
              </div>
              {career.map((c, i) => {
                const ppgRow = c.games_started > 0 ? (Number(c.starter_points) / c.games_started).toFixed(1) : '—'
                return (
                  <div className="kp-career-row" key={i}>
                    <span style={{ color: 'var(--gold)' }}>S{c.season} · {SEASON_YEAR(c.season)}</span>
                    <span>{c.owner}</span>
                    <span style={{ textAlign: 'right' }}>{c.games_started}</span>
                    <span style={{ textAlign: 'right' }}>{Number(c.starter_points).toFixed(1)}</span>
                    <span style={{ textAlign: 'right', color: 'var(--cream-muted)' }}>{ppgRow}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="kp-modal-section">TRANSACTION HISTORY</div>
        {events.length === 0 ? (
          <p style={{ color: 'var(--cream-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '1rem 0' }}>
            No transaction history found.
          </p>
        ) : (
          <div className="kp-timeline">
            {events.map((e, i) => <TimelineEvent key={i} event={e} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight, danger }) {
  const style = danger
    ? { color: 'var(--crimson)', fontSize: '0.78rem', letterSpacing: '0.04em' }
    : highlight ? { color: 'var(--gold)' } : {}
  return (
    <div className="kp-stat">
      <div className="kp-stat-label">{label}</div>
      <div className="kp-stat-value" style={style}>{value ?? '—'}</div>
    </div>
  )
}

function TimelineEvent({ event }) {
  const meta = KIND_META[event.kind] || { label: event.kind?.toUpperCase(), color: 'var(--cream-muted)' }
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `S${event.season} (${event.year}) draft`

  let body
  if (event.kind === 'drafted') {
    body = <>by <strong>{event.owner}</strong> with pick {event.detail}</>
  } else if (event.kind === 'kept') {
    body = <>kept by <strong>{event.owner}</strong> with pick {event.detail}</>
  } else if (event.kind === 'added') {
    body = <>{event.detail} by <strong>{event.owner}</strong></>
  } else if (event.kind === 'dropped') {
    body = <>{event.detail} by <strong>{event.owner}</strong></>
  } else if (event.kind === 'traded') {
    body = <>from <strong>{event.from_owner || '?'}</strong> to <strong>{event.owner || '?'}</strong></>
  } else {
    body = <>{event.detail}</>
  }

  return (
    <div className="kp-event">
      <div className="kp-event-badge" style={{ borderColor: meta.color, color: meta.color }}>
        {meta.label}
      </div>
      <div className="kp-event-body">{body}</div>
      <div className="kp-event-date">{dateStr}</div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useDatabase } from '../../context/DatabaseContext'
import DataService, { SEASON_YEAR } from '../../services/DataService'
import PlayerCard from './PlayerCard'

const POS_COLORS = {
  QB: '#c45050', RB: '#5fa05a', WR: '#4a85c4', TE: '#c4a850',
  K: '#8a8a8a', DEF: '#8a5a8a', DST: '#8a5a8a',
}

/**
 * Modal showing both teams' rosters for a single matchup.
 *
 * Props:
 *  - season, week
 *  - ownerA, ownerB (left/right teams)
 *  - scoreA, scoreB (optional — used for header)
 *  - matchType (regular/playoff/championship)
 *  - onClose
 */
export default function MatchupView({ season, week, ownerA, ownerB, scoreA, scoreB, matchType, onClose }) {
  const { db } = useDatabase()
  const [selectedPid, setSelectedPid] = useState(null)

  const rosters = useMemo(() => (
    db && ownerA && ownerB ? DataService.getMatchupRosters(db, season, week, ownerA, ownerB) : null
  ), [db, season, week, ownerA, ownerB])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      // If a player card is open, close it first; else close matchup
      if (selectedPid) setSelectedPid(null)
      else onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selectedPid])

  if (!rosters) return null
  const aPlayers = rosters[ownerA] || []
  const bPlayers = rosters[ownerB] || []

  const aWon = scoreA != null && scoreB != null && scoreA > scoreB
  const bWon = scoreA != null && scoreB != null && scoreB > scoreA

  return (
    <>
      <div className="kp-modal-backdrop" onClick={onClose}>
        <div className="kp-modal kp-matchup-modal" onClick={e => e.stopPropagation()}>
          <div className="kp-modal-header">
            <div>
              <div className="kp-modal-title">
                Week {week} · S{season} ({SEASON_YEAR(season)})
              </div>
              <div className="kp-modal-sub">
                {matchType && matchType !== 'regular' && (
                  <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{matchType.toUpperCase()}</span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="kp-modal-close" aria-label="Close">×</button>
          </div>

          {/* Score header */}
          <div className="kp-matchup-score">
            <TeamScore owner={ownerA} score={scoreA} won={aWon} />
            <div className="kp-matchup-vs">VS</div>
            <TeamScore owner={ownerB} score={scoreB} won={bWon} align="right" />
          </div>

          <div className="kp-matchup-grid">
            <RosterSide owner={ownerA} players={aPlayers} onPlayerClick={setSelectedPid} />
            <RosterSide owner={ownerB} players={bPlayers} onPlayerClick={setSelectedPid} />
          </div>
        </div>
      </div>

      {selectedPid && (
        <PlayerCard playerId={selectedPid} onClose={() => setSelectedPid(null)} />
      )}
    </>
  )
}

function TeamScore({ owner, score, won, align }) {
  return (
    <div style={{ textAlign: align || 'left', flex: 1 }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.1rem',
        color: won ? 'var(--win-fg)' : 'var(--cream)',
      }}>
        {owner}
      </div>
      {score != null && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          color: won ? 'var(--win-fg)' : 'var(--cream-muted)',
        }}>
          {Number(score).toFixed(2)}
        </div>
      )}
    </div>
  )
}

function RosterSide({ owner, players, onPlayerClick }) {
  // Split starters / bench. Some pre-S6 weeks have NULL start — fall back to "all"
  const haveStartLabels = players.some(p => p.start === 'TRUE' || p.start === 'FALSE')
  const starters = haveStartLabels ? players.filter(p => p.start === 'TRUE') : players
  const bench = haveStartLabels ? players.filter(p => p.start !== 'TRUE') : []

  const totalStarter = starters.reduce((s, p) => s + (Number(p.points) || 0), 0)

  return (
    <div className="kp-roster-side">
      <div className="kp-roster-header">
        <span className="kp-roster-owner">{owner}</span>
        {haveStartLabels && (
          <span className="kp-roster-total">{totalStarter.toFixed(2)}</span>
        )}
      </div>

      {haveStartLabels ? (
        <>
          <div className="kp-roster-section-label">STARTERS</div>
          {starters.length === 0
            ? <div className="kp-roster-empty">no starters logged</div>
            : starters.map((p, i) => <PlayerRow key={`s${i}`} p={p} onClick={onPlayerClick} starter />)
          }
          {bench.length > 0 && (
            <>
              <div className="kp-roster-section-label">BENCH</div>
              {bench.map((p, i) => <PlayerRow key={`b${i}`} p={p} onClick={onPlayerClick} />)}
            </>
          )}
        </>
      ) : (
        <>
          <div className="kp-roster-section-label">ROSTER</div>
          {players.map((p, i) => <PlayerRow key={i} p={p} onClick={onPlayerClick} />)}
        </>
      )}
    </div>
  )
}

function PlayerRow({ p, onClick, starter }) {
  const posColor = POS_COLORS[p.position] || 'var(--cream-muted)'
  const clickable = !!p.player_id
  const points = Number(p.points)
  return (
    <div className={`kp-roster-row${starter ? ' kp-roster-row--starter' : ''}`}>
      <span className="kp-roster-pos" style={{ color: posColor }}>{p.position || '—'}</span>
      <button
        type="button"
        className="player-link kp-roster-name"
        disabled={!clickable}
        onClick={() => clickable && onClick(p.player_id)}
      >
        {p.name || '—'}
      </button>
      <span className="kp-roster-team">{p.team || '—'}</span>
      <span className="kp-roster-points">
        {Number.isFinite(points) ? points.toFixed(1) : '—'}
      </span>
    </div>
  )
}

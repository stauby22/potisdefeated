import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { CURRENT_SEASON, SEASON_YEAR } from '../services/DataService'
import Panel from '../components/ui/Panel'
import WinLossBadge from '../components/ui/WinLossBadge'

const MATCH_TYPE_LABELS = {
  regular: 'Regular Season',
  quarterfinal: 'Quarterfinals',
  semifinal: 'Semifinals',
  championship: 'Championship',
  consolation: 'Consolation Bowl',
  last_place: 'Toilet Bowl',
  fifth_place: '5th Place',
  third_place: '3rd Place',
  seventh_place: '7th Place',
}

export default function WeeklyMatchups() {
  const { db } = useDatabase()

  const [season, setSeason] = useState(CURRENT_SEASON)
  const [week, setWeek] = useState(null)

  const seasonList = useMemo(() => db ? DataService.getSeasonList(db) : [], [db])
  const weekList = useMemo(() => {
    if (!db) return []
    const weeks = DataService.getSeasonWeeks(db, season)
    if (week === null && weeks.length > 0) {
      // Default to last week
      setTimeout(() => setWeek(weeks[weeks.length - 1]), 0)
    }
    return weeks
  }, [db, season])

  const matchups = useMemo(() => {
    if (!db || week === null) return []
    return DataService.getWeeklyMatchups(db, season, week)
  }, [db, season, week])

  const pairs = useMemo(() => pairMatchups(matchups), [matchups])

  // Group by match_type
  const grouped = useMemo(() => {
    const groups = {}
    for (const pair of pairs) {
      const type = pair[0]?.match_type || 'regular'
      if (!groups[type]) groups[type] = []
      groups[type].push(pair)
    }
    return groups
  }, [pairs])

  function handleSeasonChange(e) {
    setSeason(parseInt(e.target.value))
    setWeek(null)
  }

  return (
    <div className="page">
      <div className="page-title flex align-center justify-between wrap gap-2">
        <h2>Weekly Matchups</h2>
        <div className="flex gap-1 wrap">
          <select value={season} onChange={handleSeasonChange}>
            {seasonList.map(s => (
              <option key={s} value={s}>Season {s} ({SEASON_YEAR(s)})</option>
            ))}
          </select>
          <select value={week ?? ''} onChange={e => setWeek(parseInt(e.target.value))}>
            {weekList.map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      </div>

      {week === null ? (
        <div className="panel text-center" style={{ padding: '2rem', color: 'var(--cream-muted)' }}>
          Loading weeks...
        </div>
      ) : pairs.length === 0 ? (
        <div className="panel text-center" style={{ padding: '2rem', color: 'var(--cream-muted)' }}>
          No matchups found for Season {season}, Week {week}.
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([type, typePairs]) => (
            <Panel
              key={type}
              title={MATCH_TYPE_LABELS[type] || type}
              style={{ marginBottom: '1rem' }}
            >
              {typePairs.map((pair, i) => (
                <MatchupRow key={i} home={pair[0]} away={pair[1]} />
              ))}
            </Panel>
          ))}

          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            <Link to={`/seasons/${season}`} style={{ fontSize: '0.72rem' }}>
              View full Season {season} standings →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// weeklyResults has team + opponent columns — use that cross-reference to pair rows.
// match_id is unique per row, NOT per matchup, so don't use it for pairing.
function pairMatchups(rows) {
  const seen = new Set()
  const pairs = []
  for (const row of rows) {
    if (seen.has(row.team)) continue
    seen.add(row.team)
    if (row.opponent) seen.add(row.opponent)
    const opp = rows.find(r => r.team === row.opponent)
    pairs.push([row, opp || null])
  }
  return pairs
}

function MatchupRow({ home, away }) {
  if (!home) return null
  // win is stored as integer 0/1 in SQLite — use == 1 to avoid JSX rendering "0"
  const homeWon = home.win == 1
  const awayWon = away?.win == 1
  return (
    <div className="matchup-card">
      <div className={`matchup-card__team ${homeWon ? 'matchup-card__winner' : 'matchup-card__loser'}`}>
        <Link to={`/owner/${home.team?.toLowerCase()}`} style={{ color: 'inherit' }}>
          {home.team}
        </Link>
        {homeWon && <span style={{ marginLeft: '0.35rem', fontSize: '0.85em' }}>✓</span>}
      </div>

      <div className="matchup-card__score">
        <span style={{ color: homeWon ? 'var(--win-fg)' : 'var(--cream-muted)' }}>
          {Number(home.points_for).toFixed(2)}
        </span>
        <span>–</span>
        <span style={{ color: awayWon ? 'var(--win-fg)' : 'var(--cream-muted)' }}>
          {away ? Number(away.points_for).toFixed(2) : '—'}
        </span>
      </div>

      <div className={`matchup-card__team matchup-card__right ${awayWon ? 'matchup-card__winner' : 'matchup-card__loser'}`}>
        {awayWon && <span style={{ marginRight: '0.35rem', fontSize: '0.85em' }}>✓</span>}
        {away
          ? <Link to={`/owner/${away.team?.toLowerCase()}`} style={{ color: 'inherit' }}>{away.team}</Link>
          : '—'
        }
      </div>
    </div>
  )
}

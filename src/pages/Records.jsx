import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { SEASON_YEAR } from '../services/DataService'
import Panel from '../components/ui/Panel'

export default function Records() {
  const { db } = useDatabase()

  const highScores     = useMemo(() => db ? DataService.getHighestSingleGameScores(db, 10) : [], [db])
  const blowouts       = useMemo(() => db ? DataService.getBiggestBlowouts(db, 10) : [], [db])
  const closest        = useMemo(() => db ? DataService.getClosestGames(db, 10) : [], [db])
  const lowWins        = useMemo(() => db ? DataService.getLowestWinningScores(db, 10) : [], [db])
  const mostPtsSeason  = useMemo(() => db ? DataService.getMostPointsInSeason(db, 10) : [], [db])
  const fewestPtsSeason= useMemo(() => db ? DataService.getFewestPointsInSeason(db, 10) : [], [db])
  const championships  = useMemo(() => db ? DataService.getChampionshipWins(db) : [], [db])

  // Streak computation — read all results per owner and compute
  const streaks = useMemo(() => {
    if (!db) return []
    const owners = DataService.getOwnerList(db)
    return owners.map(o => {
      const results = DataService.getOwnerResults(db, o.owner)
      let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
      for (const r of results) {
        if (r.win) { curWin++; curLoss = 0; if (curWin > maxWin) maxWin = curWin }
        else        { curLoss++; curWin = 0; if (curLoss > maxLoss) maxLoss = curLoss }
      }
      return { owner: o.owner, maxWin, maxLoss }
    })
  }, [db])

  const longestWinStreak  = [...streaks].sort((a, b) => b.maxWin - a.maxWin)[0]
  const longestLossStreak = [...streaks].sort((a, b) => b.maxLoss - a.maxLoss)[0]

  return (
    <div className="page">
      <div className="page-title">
        <h2>Records &amp; Fun Stats</h2>
      </div>

      {/* Top-line records */}
      <div className="grid-4 mb-3">
        {highScores[0] && (
          <div className="record-card panel--highlighted">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>All-Time High Score</div>
            <div className="record-card__value text-win">{Number(highScores[0].points_for).toFixed(2)}</div>
            <div className="record-card__context">
              <Link to={`/owner/${highScores[0].team?.toLowerCase()}`}>{highScores[0].team}</Link>
              {' '} · S{highScores[0].season} W{highScores[0].week}
              {highScores[0].match_type !== 'regular' && ` · ${highScores[0].match_type}`}
            </div>
          </div>
        )}
        {blowouts[0] && (
          <div className="record-card">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>Biggest Blowout</div>
            <div className="record-card__value text-crimson">+{Number(blowouts[0].margin).toFixed(2)}</div>
            <div className="record-card__context">
              <Link to={`/owner/${blowouts[0].team?.toLowerCase()}`}>{blowouts[0].team}</Link>
              {' '}def.{' '}
              <Link to={`/owner/${blowouts[0].opponent?.toLowerCase()}`}>{blowouts[0].opponent}</Link>
              {' '} · S{blowouts[0].season} W{blowouts[0].week}
            </div>
          </div>
        )}
        {closest[0] && (
          <div className="record-card">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>Closest Game</div>
            <div className="record-card__value">{Number(closest[0].abs_margin).toFixed(2)}</div>
            <div className="record-card__context">
              <Link to={`/owner/${closest[0].team?.toLowerCase()}`}>{closest[0].team}</Link>
              {' '}vs.{' '}
              <Link to={`/owner/${closest[0].opponent?.toLowerCase()}`}>{closest[0].opponent}</Link>
              {' '} · S{closest[0].season} W{closest[0].week}
            </div>
          </div>
        )}
        {lowWins[0] && (
          <div className="record-card">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>Lowest Winning Score</div>
            <div className="record-card__value text-loss">{Number(lowWins[0].points_for).toFixed(2)}</div>
            <div className="record-card__context">
              <Link to={`/owner/${lowWins[0].team?.toLowerCase()}`}>{lowWins[0].team}</Link>
              {' '}def.{' '}
              <Link to={`/owner/${lowWins[0].opponent?.toLowerCase()}`}>{lowWins[0].opponent}</Link>
              {' '} · S{lowWins[0].season} W{lowWins[0].week}
            </div>
          </div>
        )}
        {longestWinStreak && (
          <div className="record-card">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>Longest Win Streak</div>
            <div className="record-card__value text-win">{longestWinStreak.maxWin}</div>
            <div className="record-card__context">
              <Link to={`/owner/${longestWinStreak.owner.toLowerCase()}`}>{longestWinStreak.owner}</Link>
            </div>
          </div>
        )}
        {longestLossStreak && (
          <div className="record-card">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>Longest Loss Streak</div>
            <div className="record-card__value text-loss">{longestLossStreak.maxLoss}</div>
            <div className="record-card__context">
              <Link to={`/owner/${longestLossStreak.owner.toLowerCase()}`}>{longestLossStreak.owner}</Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* High scores */}
        <Panel title="Top Single-Game Scores (All Time)">
          <RecordTable
            rows={highScores}
            cols={[
              { key: 'points_for', label: 'Score', render: v => <span className="text-win text-mono">{Number(v).toFixed(2)}</span> },
              { key: 'team', label: 'Manager', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'opponent', label: 'Opponent', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'season', label: 'S/W', render: (v, row) => `S${v} W${row.week}` },
              { key: 'match_type', label: 'Type', render: v => <span className="text-xs text-muted">{v}</span> },
            ]}
          />
        </Panel>

        {/* Biggest blowouts */}
        <Panel title="Biggest Blowouts">
          <RecordTable
            rows={blowouts}
            cols={[
              { key: 'margin', label: 'Margin', render: v => <span className="text-crimson text-mono">+{Number(v).toFixed(2)}</span> },
              { key: 'team', label: 'Winner', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'opponent', label: 'Loser', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'season', label: 'S/W', render: (v, row) => `S${v} W${row.week}` },
            ]}
          />
        </Panel>

        {/* Closest games */}
        <Panel title="Closest Games">
          <RecordTable
            rows={closest}
            cols={[
              { key: 'abs_margin', label: 'Margin', render: v => <span className="text-mono">{Number(v).toFixed(2)}</span> },
              { key: 'team', label: 'Winner', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'opponent', label: 'Loser', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'season', label: 'S/W', render: (v, row) => `S${v} W${row.week}` },
            ]}
          />
        </Panel>

        {/* Most points in a season */}
        <Panel title="Most Points — Regular Season">
          <RecordTable
            rows={mostPtsSeason}
            cols={[
              { key: 'total_pf', label: 'PF', render: v => <span className="text-win text-mono">{Number(v).toFixed(1)}</span> },
              { key: 'team', label: 'Manager', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'season', label: 'Season', render: v => <Link to={`/seasons/${v}`} style={{ color: 'var(--gold)' }}>{SEASON_YEAR(v)}</Link> },
              { key: 'games', label: 'Games', render: v => <span className="text-muted text-mono">{v}</span> },
            ]}
          />
        </Panel>

        {/* Fewest points in a season */}
        <Panel title="Fewest Points — Regular Season">
          <RecordTable
            rows={fewestPtsSeason}
            cols={[
              { key: 'total_pf', label: 'PF', render: v => <span className="text-loss text-mono">{Number(v).toFixed(1)}</span> },
              { key: 'team', label: 'Manager', render: v => <Link to={`/owner/${v?.toLowerCase()}`}>{v}</Link> },
              { key: 'season', label: 'Season', render: v => <Link to={`/seasons/${v}`} style={{ color: 'var(--gold)' }}>{SEASON_YEAR(v)}</Link> },
              { key: 'games', label: 'Games', render: v => <span className="text-muted text-mono">{v}</span> },
            ]}
          />
        </Panel>

        {/* Championships */}
        <Panel title="Championships">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {championships.map((c, i) => (
              <div key={c.owner} className="flex align-center gap-2" style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--gold)', minWidth: '1.8rem' }}>
                  {c.championships}x
                </span>
                <Link to={`/owner/${c.owner.toLowerCase()}`} style={{ fontFamily: 'var(--font-mono)', color: 'var(--cream)', flex: 1 }}>
                  {c.owner}
                </Link>
                <span style={{ fontSize: '1.2rem' }}>{'🏆'.repeat(c.championships)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function RecordTable({ rows, cols }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style={{ width: '2rem', color: 'var(--cream-muted)' }}>#</th>
            {cols.map(c => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cream-muted)' }}>{i + 1}</td>
              {cols.map(c => (
                <td key={c.key} style={{ fontSize: '0.82rem' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

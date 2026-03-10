import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { SEASON_YEAR, ALL_OWNERS } from '../services/DataService'
import Panel from '../components/ui/Panel'
import { Trophies, RankBadge } from '../components/ui/Trophies'
import OwnerCoin from '../components/ui/OwnerCoin'
import { RecordBadge } from '../components/ui/WinLossBadge'

function computeStreaks(results) {
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
  for (const r of results) {
    if (r.win) {
      curWin++; curLoss = 0
      if (curWin > maxWin) maxWin = curWin
    } else {
      curLoss++; curWin = 0
      if (curLoss > maxLoss) maxLoss = curLoss
    }
  }
  return { maxWin, maxLoss }
}

export default function OwnerProfile() {
  const { name } = useParams()
  const { db } = useDatabase()

  // Normalize: capitalize first letter
  const ownerName = name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : ''

  const owner = useMemo(() => db ? DataService.getOwner(db, ownerName) : null, [db, ownerName])
  const seasons = useMemo(() => db ? DataService.getOwnerSeasons(db, ownerName) : [], [db, ownerName])
  const h2hMatrix = useMemo(() => db ? DataService.getOwnerH2HMatrix(db, ownerName) : [], [db, ownerName])
  const bigWins = useMemo(() => db ? DataService.getOwnerBiggestWins(db, ownerName, 5) : [], [db, ownerName])
  const bigLosses = useMemo(() => db ? DataService.getOwnerBiggestLosses(db, ownerName, 5) : [], [db, ownerName])
  const allResults = useMemo(() => db ? DataService.getOwnerResults(db, ownerName) : [], [db, ownerName])
  const streaks = useMemo(() => computeStreaks(allResults), [allResults])

  if (!owner) {
    return (
      <div className="page">
        <div className="panel text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤷</div>
          <h2 style={{ color: 'var(--cream-muted)' }}>Manager not found: {ownerName}</h2>
          <Link to="/standings" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.8rem' }}>
            ← Back to standings
          </Link>
        </div>
      </div>
    )
  }

  const winPct = owner.total_wins != null
    ? ((owner.total_wins / (owner.total_wins + owner.total_losses)) * 100).toFixed(1)
    : '—'

  const avgPF = seasons.length
    ? (seasons.reduce((s, r) => s + (Number(r.points_for) || 0), 0) / seasons.length).toFixed(1)
    : '—'

  return (
    <div className="page">
      {/* Header card */}
      <div className="panel" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-strong)' }}>
        <div className="flex align-center gap-2 wrap">
          <OwnerCoin name={ownerName} size="lg" linkable={false} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2rem' }}>{ownerName}</h2>
            {owner.current_team_name && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cream-muted)', marginTop: '0.15rem' }}>
                {owner.current_team_name}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', marginTop: '0.25rem', letterSpacing: '0.08em' }}>
              Season {owner.first_season}–{owner.last_season} · {owner.seasons_played} seasons
            </div>
          </div>
          {owner.championships > 0 && <Trophies count={owner.championships} />}
        </div>

        {/* Career stat row */}
        <div className="grid-4 mt-3">
          <StatBox label="Win %" value={`${winPct}%`} />
          <StatBox label="Career W–L" value={`${owner.total_wins}–${owner.total_losses}`} />
          <StatBox label="Championships" value={owner.championships || 0} />
          <StatBox label="Avg PF / Season" value={avgPF} />
          <StatBox label="Total PF" value={Number(owner.total_points_for).toFixed(0)} />
          <StatBox label="Total PA" value={Number(owner.total_points_against).toFixed(0)} />
          <StatBox label="Best Finish" value={`${owner.best_rank}${ordinal(owner.best_rank)}`} />
          <StatBox label="Longest Win Streak" value={streaks.maxWin} />
        </div>
      </div>

      <div className="grid-2">
        {/* Season-by-season */}
        <Panel title="Season-by-Season">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>W–L</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                  <th style={{ textAlign: 'right' }}>Rank</th>
                  {seasons.some(s => s.draft_grade) && <th>Draft</th>}
                </tr>
              </thead>
              <tbody>
                {seasons.map(s => (
                  <tr key={s.season}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <Link to={`/seasons/${s.season}`} style={{ color: 'var(--gold)' }}>
                        {SEASON_YEAR(s.season)}
                      </Link>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      <span className="text-win">{s.wins}</span>
                      <span className="text-muted">–</span>
                      <span className="text-loss">{s.losses}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {Number(s.points_for).toFixed(1)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <RankBadge rank={s.rank} />
                    </td>
                    {seasons.some(s => s.draft_grade) && (
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '0.78rem' }}>
                        {s.draft_grade || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Head-to-head vs everyone */}
        <Panel title="Head-to-Head vs. Every Manager">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>vs.</th>
                  <th style={{ textAlign: 'center' }}>W–L</th>
                  <th style={{ textAlign: 'right' }}>Avg PF</th>
                  <th style={{ textAlign: 'right' }}>Avg PA</th>
                </tr>
              </thead>
              <tbody>
                {h2hMatrix.map(row => (
                  <tr key={row.opponent}>
                    <td>
                      <Link to={`/h2h?o1=${ownerName}&o2=${row.opponent}`} style={{ color: 'var(--cream-muted)' }}>
                        {row.opponent}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <RecordBadge wins={row.wins} losses={row.losses} />
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {row.avg_pf}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {row.avg_pa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Best and worst games */}
      <div className="grid-2 mt-3">
        <Panel title="Biggest Wins">
          <GameList games={bigWins} type="win" owner={ownerName} />
        </Panel>
        <Panel title="Worst Losses">
          <GameList games={bigLosses} type="loss" owner={ownerName} />
        </Panel>
      </div>
    </div>
  )
}

function GameList({ games, type, owner }) {
  return (
    <div>
      {games.map((g, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <span style={{ color: type === 'win' ? 'var(--win-fg)' : 'var(--loss-fg)' }}>
                {Number(g.points_for).toFixed(2)}
              </span>
              <span style={{ color: 'var(--cream-muted)' }}> – </span>
              <span>{Number(g.points_against).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--cream-muted)', marginTop: '0.1rem' }}>
              vs. {g.opponent} · S{g.season} W{g.week}
              {g.match_type !== 'regular' && ` · ${g.match_type}`}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)' }}>
            {type === 'win' ? '+' : ''}{Number(g.margin).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <span className="stat-box__value">{value}</span>
      <span className="stat-box__label">{label}</span>
    </div>
  )
}

function ordinal(n) {
  if (!n) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

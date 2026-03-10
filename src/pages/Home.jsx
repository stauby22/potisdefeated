import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { CURRENT_SEASON, SEASON_YEAR } from '../services/DataService'
import Panel from '../components/ui/Panel'
import { Trophies } from '../components/ui/Trophies'
import OwnerCoin from '../components/ui/OwnerCoin'
import WinLossBadge from '../components/ui/WinLossBadge'

export default function Home() {
  const { db } = useDatabase()

  const standings = useMemo(() => db ? DataService.getAllTimeStandings(db) : [], [db])
  const recentStandings = useMemo(() => db ? DataService.getSeasonStandings(db, CURRENT_SEASON) : [], [db])
  const highlights = useMemo(() => db ? DataService.getLeagueHighlights(db) : {}, [db])
  const recentMatchups = useMemo(() => {
    if (!db) return []
    // Get last playoff week of current season
    const weeks = DataService.getSeasonWeeks(db, CURRENT_SEASON)
    const lastWeek = weeks[weeks.length - 1]
    return lastWeek ? DataService.getRecentMatchups(db, CURRENT_SEASON, lastWeek) : []
  }, [db])

  const champion = recentStandings.find(r => r.rank === 1)

  return (
    <div className="page">
      {/* League banner */}
      <div className="panel" style={{
        background: 'var(--bg-deep)',
        borderColor: 'var(--crimson)',
        marginBottom: '1.5rem',
        textAlign: 'center',
        padding: '1.75rem 1.25rem',
      }}>
        <h1 style={{ marginBottom: '0.4rem' }}>Pot Is Defeated</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--cream-muted)' }}>
          12 SEASONS · 15 MANAGERS · ONE FLEECE-LINED CROWN
        </div>

        {champion && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>Season {CURRENT_SEASON} Champion</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--gold)' }}>
              {champion.team} 🏆
            </div>
            {champion.name && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cream-muted)' }}>
                {champion.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick stat row */}
      <div className="grid-4 mb-3">
        <div className="panel text-center">
          <div className="stat-box">
            <span className="stat-box__value">12</span>
            <span className="stat-box__label">Seasons</span>
          </div>
        </div>
        <div className="panel text-center">
          <div className="stat-box">
            <span className="stat-box__value">15</span>
            <span className="stat-box__label">Managers Ever</span>
          </div>
        </div>
        {highlights.highScore && (
          <div className="panel text-center">
            <div className="stat-box">
              <span className="stat-box__value">{Number(highlights.highScore.points_for).toFixed(1)}</span>
              <span className="stat-box__label">All-Time High Score</span>
            </div>
          </div>
        )}
        {highlights.closestGame && (
          <div className="panel text-center">
            <div className="stat-box">
              <span className="stat-box__value">{Number(highlights.closestGame.abs_margin).toFixed(2)}</span>
              <span className="stat-box__label">Closest Margin Ever</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Season 12 final standings */}
        <Panel title={`Season ${CURRENT_SEASON} (${SEASON_YEAR(CURRENT_SEASON)}) Final Standings`}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Manager</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>W–L</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                </tr>
              </thead>
              <tbody>
                {recentStandings.slice(0, 10).map(row => (
                  <tr key={row.team}>
                    <td style={{ color: row.rank === 1 ? 'var(--gold)' : 'var(--cream-muted)', fontFamily: 'var(--font-mono)' }}>
                      {row.rank === 1 ? '🏆' : row.rank}
                    </td>
                    <td className="highlight">
                      <Link to={`/owner/${row.team?.toLowerCase()}`} style={{ color: 'var(--cream)' }}>
                        {row.team}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.name}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      <span className="text-win">{row.wins}</span>
                      <span className="text-muted">–</span>
                      <span className="text-loss">{row.losses}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {Number(row.points_for).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <Link to={`/seasons/${CURRENT_SEASON}`} style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              Full season breakdown →
            </Link>
          </div>
        </Panel>

        {/* All-time championships */}
        <Panel title="All-Time Championship Count">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {standings.filter(o => o.championships > 0).map(owner => (
              <div key={owner.owner} className="flex align-center gap-2" style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
                <OwnerCoin name={owner.owner} size="sm" />
                <Link to={`/owner/${owner.owner.toLowerCase()}`} style={{ color: 'var(--cream)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', flex: 1 }}>
                  {owner.owner}
                </Link>
                <Trophies count={owner.championships} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <Link to="/standings" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              All-time standings →
            </Link>
          </div>
        </Panel>
      </div>

      {/* Recent championship matchup */}
      {recentMatchups.length > 0 && (
        <Panel title="Season 12 Championship Week Results" style={{ marginTop: '1.25rem' }}>
          {pairMatchups(recentMatchups).map((pair, i) => (
            <MatchupRow key={i} home={pair[0]} away={pair[1]} />
          ))}
        </Panel>
      )}

      {/* Quick links */}
      <div className="grid-3" style={{ marginTop: '1.5rem' }}>
        {[
          { to: '/draft', label: 'Draft History', desc: '12 seasons of picks' },
          { to: '/records', label: 'Records & Fun Stats', desc: 'Biggest blowouts, streaks, and more' },
          { to: '/h2h', label: 'Head-to-Head', desc: 'Pick any two managers' },
        ].map(({ to, label, desc }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div className="panel" style={{ height: '100%', transition: 'border-color 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-muted)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-muted)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// match_id is unique per row — pair by team <-> opponent cross-reference instead.
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
  // win is stored as integer 0/1 — coerce to bool before using in JSX expressions
  const homeWon = home.win == 1
  const awayWon = away?.win == 1
  return (
    <div className="matchup-card">
      <div className={`matchup-card__team ${homeWon ? 'matchup-card__winner' : 'matchup-card__loser'}`}>
        <Link to={`/owner/${home.team?.toLowerCase()}`} style={{ color: 'inherit' }}>{home.team}</Link>
        {homeWon ? ' 🏆' : ''}
      </div>
      <div className="matchup-card__score">
        {Number(home.points_for).toFixed(2)}
        <span>–</span>
        {away ? Number(away.points_for).toFixed(2) : '—'}
      </div>
      <div className={`matchup-card__team matchup-card__right ${awayWon ? 'matchup-card__winner' : 'matchup-card__loser'}`}>
        {away ? <Link to={`/owner/${away.team?.toLowerCase()}`} style={{ color: 'inherit' }}>{away.team}</Link> : '—'}
      </div>
    </div>
  )
}

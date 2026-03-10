import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { ALL_OWNERS, SEASON_YEAR } from '../services/DataService'
import Panel from '../components/ui/Panel'
import WinLossBadge from '../components/ui/WinLossBadge'
import OwnerCoin from '../components/ui/OwnerCoin'

export default function HeadToHead() {
  const { db } = useDatabase()
  const [searchParams, setSearchParams] = useSearchParams()

  const [o1, setO1] = useState(searchParams.get('o1') || '')
  const [o2, setO2] = useState(searchParams.get('o2') || '')

  useEffect(() => {
    if (o1 && o2 && o1 !== o2) {
      setSearchParams({ o1, o2 })
    }
  }, [o1, o2])

  const ownerList = useMemo(() => db ? DataService.getOwnerList(db).map(o => o.owner) : ALL_OWNERS, [db])
  const games = useMemo(() => {
    if (!db || !o1 || !o2 || o1 === o2) return []
    return DataService.getH2H(db, o1, o2)
  }, [db, o1, o2])

  // Compute summary from o1's perspective
  const summary = useMemo(() => {
    const o1Games = games.filter(g => g.team === o1)
    const wins = o1Games.filter(g => g.win == 1).length
    const losses = o1Games.length - wins
    const avgPF = o1Games.length ? (o1Games.reduce((s, g) => s + Number(g.points_for), 0) / o1Games.length).toFixed(1) : '—'
    const avgPA = o1Games.length ? (o1Games.reduce((s, g) => s + Number(g.points_against), 0) / o1Games.length).toFixed(1) : '—'
    return { wins, losses, totalGames: o1Games.length, avgPF, avgPA }
  }, [games, o1])

  // Deduplicate by season+week (each game has 2 rows in weeklyResults).
  // match_id is unique per row, not per matchup — use team cross-reference instead.
  const uniqueGames = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const g of games) {
      const key = `${g.season}-${g.week}`
      if (seen.has(key)) continue
      seen.add(key)
      const o1row = games.find(r => r.season === g.season && r.week === g.week && r.team === o1)
      const o2row = games.find(r => r.season === g.season && r.week === g.week && r.team === o2)
      if (o1row) result.push({ o1row, o2row: o2row || null })
    }
    return result
  }, [games, o1, o2])

  const canCompare = o1 && o2 && o1 !== o2

  return (
    <div className="page">
      <div className="page-title">
        <h2>Head-to-Head</h2>
      </div>

      {/* Picker */}
      <Panel style={{ marginBottom: '1.25rem' }}>
        <div className="flex align-center gap-2 wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            {o1 && <OwnerCoin name={o1} size="sm" linkable={false} />}
            <select value={o1} onChange={e => setO1(e.target.value)} style={{ flex: 1 }}>
              <option value="">— Select manager —</option>
              {ownerList.filter(o => o !== o2).map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream-muted)', padding: '0 0.5rem' }}>vs.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            {o2 && <OwnerCoin name={o2} size="sm" linkable={false} />}
            <select value={o2} onChange={e => setO2(e.target.value)} style={{ flex: 1 }}>
              <option value="">— Select manager —</option>
              {ownerList.filter(o => o !== o1).map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {canCompare && uniqueGames.length > 0 && (
        <>
          {/* Summary */}
          <div className="panel" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-strong)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
              {/* o1 side */}
              <div>
                <OwnerCoin name={o1} size="lg" linkable={false} style={{ margin: '0 auto 0.5rem' }} />
                <Link to={`/owner/${o1.toLowerCase()}`}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--cream)' }}>{o1}</div>
                </Link>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', color: summary.wins > summary.losses ? 'var(--win-fg)' : 'var(--cream-muted)', lineHeight: 1 }}>
                  {summary.wins}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', letterSpacing: '0.06em' }}>WINS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                  Avg: <span style={{ color: 'var(--cream)' }}>{summary.avgPF}</span>
                </div>
              </div>

              {/* VS */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream-muted)' }}>
                VS
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', marginTop: '0.25rem' }}>
                  {summary.totalGames} games
                </div>
              </div>

              {/* o2 side */}
              <div>
                <OwnerCoin name={o2} size="lg" linkable={false} style={{ margin: '0 auto 0.5rem' }} />
                <Link to={`/owner/${o2.toLowerCase()}`}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--cream)' }}>{o2}</div>
                </Link>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', color: summary.losses > summary.wins ? 'var(--win-fg)' : 'var(--cream-muted)', lineHeight: 1 }}>
                  {summary.losses}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', letterSpacing: '0.06em' }}>WINS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                  Avg: <span style={{ color: 'var(--cream)' }}>{summary.avgPA}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Game log */}
          <Panel title="Full Game Log">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Week</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>{o1}</th>
                    <th style={{ textAlign: 'right' }}>{o2}</th>
                    <th>Result</th>
                    <th style={{ textAlign: 'right' }}>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueGames.map(({ o1row, o2row }, i) => {
                    const winner = o1row.win ? o1 : o2
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <Link to={`/seasons/${o1row.season}`} style={{ color: 'var(--gold)' }}>
                            {SEASON_YEAR(o1row.season)}
                          </Link>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>W{o1row.week}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', textTransform: 'capitalize' }}>{o1row.match_type}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: o1row.win ? 'var(--win-fg)' : 'var(--cream-muted)' }}>
                          {Number(o1row.points_for).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: o2row?.win ? 'var(--win-fg)' : 'var(--cream-muted)' }}>
                          {o2row ? Number(o2row.points_for).toFixed(2) : '—'}
                        </td>
                        <td>
                          <WinLossBadge win={o1row.win} label={`${winner} wins`} />
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cream-muted)' }}>
                          {Number(o1row.abs_margin).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {canCompare && uniqueGames.length === 0 && (
        <div className="panel text-center" style={{ padding: '2rem' }}>
          <p>No matchups found between {o1} and {o2}.</p>
        </div>
      )}

      {!canCompare && (
        <div className="panel text-center" style={{ padding: '2rem', color: 'var(--cream-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚔️</div>
          <p>Select two managers above to see their complete head-to-head history.</p>
        </div>
      )}
    </div>
  )
}

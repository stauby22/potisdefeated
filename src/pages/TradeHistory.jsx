import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { ALL_OWNERS, SEASON_YEAR, YEAR_SEASON } from '../services/DataService'
import Panel from '../components/ui/Panel'

export default function TradeHistory() {
  const { db } = useDatabase()
  const [filterOwner, setFilterOwner] = useState('')
  const [filterSeason, setFilterSeason] = useState('')

  const allTrades = useMemo(() => db ? DataService.getTrades(db) : [], [db])

  // Group trades by transaction_id (each trade has multiple rows, one per asset)
  const grouped = useMemo(() => {
    const map = new Map()
    for (const row of allTrades) {
      const key = row.transaction_id
      if (!map.has(key)) {
        map.set(key, {
          transaction_id: key,
          trade_date: row.trade_date,
          week: row.week,
          year: row.year,
          league_id: row.league_id,
          sides: {}
        })
      }
      const trade = map.get(key)
      // Group assets by from_roster_id
      const sideKey = `${row.from_roster_id}:${row.from_team_name}`
      if (!trade.sides[sideKey]) {
        trade.sides[sideKey] = { rosterid: row.from_roster_id, teamName: row.from_team_name, assets: [] }
      }
      trade.sides[sideKey].assets.push({
        type: row.asset_type,
        name: row.asset_name,
        id: row.asset_id,
        toRoster: row.to_roster_id,
        toTeam: row.to_team_name,
      })
    }
    return [...map.values()].sort((a, b) => (b.trade_date || '').localeCompare(a.trade_date || ''))
  }, [allTrades])

  // Get all years and participants for filters
  const years = useMemo(() => [...new Set(allTrades.map(t => t.year).filter(Boolean))].sort((a, b) => b - a), [allTrades])
  const ownerNames = useMemo(() => {
    const names = new Set()
    grouped.forEach(t => Object.values(t.sides).forEach(s => {
      // Try to extract owner name from team name — fallback to team name
      names.add(s.teamName)
    }))
    return [...names].sort()
  }, [grouped])

  const filtered = useMemo(() => {
    return grouped.filter(t => {
      if (filterSeason && t.year !== parseInt(filterSeason)) return false
      if (filterOwner) {
        const sides = Object.values(t.sides)
        if (!sides.some(s => s.teamName === filterOwner)) return false
      }
      return true
    })
  }, [grouped, filterOwner, filterSeason])

  // For owner filter, we need to match against team name OR owner name
  // The trades table has from_team_name which is the emoji-style team name
  // We'll also offer the all-owners list for filtering

  return (
    <div className="page">
      <div className="page-title flex align-center justify-between wrap gap-2">
        <h2>Trade History</h2>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)' }}>
          {grouped.length} total trades · Seasons 9–12
        </div>
      </div>

      {/* Filters */}
      <Panel style={{ marginBottom: '1.25rem' }}>
        <div className="flex gap-2 wrap align-center">
          <select value={filterSeason} onChange={e => setFilterSeason(e.target.value)}>
            <option value="">All seasons</option>
            {years.map(y => (
              <option key={y} value={y}>{SEASON_YEAR(YEAR_SEASON(y))} (Season {YEAR_SEASON(y)})</option>
            ))}
          </select>
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">All managers</option>
            {ownerNames.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {(filterOwner || filterSeason) && (
            <button
              onClick={() => { setFilterOwner(''); setFilterSeason('') }}
              style={{
                background: 'var(--cream-faint)', border: '1px solid var(--border)',
                color: 'var(--cream-muted)', borderRadius: 'var(--radius)',
                padding: '0.35rem 0.75rem', fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem', cursor: 'pointer'
              }}
            >
              Clear filters
            </button>
          )}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)', marginLeft: 'auto' }}>
            {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <div className="panel text-center" style={{ padding: '2rem', color: 'var(--cream-muted)' }}>
          No trades found for the selected filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(trade => <TradeCard key={trade.transaction_id} trade={trade} />)}
        </div>
      )}
    </div>
  )
}

function TradeCard({ trade }) {
  const sides = Object.values(trade.sides)

  // Build a 2-sided view: what went from A to B and what went from B to A
  // Each asset has toTeam (destination team name)
  // For display, show "Team A gives: X, Y / Team B gives: Z"

  const year = trade.year
  const season = year ? YEAR_SEASON(year) : null

  return (
    <div className="panel" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', letterSpacing: '0.06em' }}>
          {trade.trade_date ? new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          {trade.week && ` · Week ${trade.week}`}
          {season && (
            <Link to={`/seasons/${season}`} style={{ marginLeft: '0.5rem', color: 'var(--gold)' }}>
              Season {season} ({year})
            </Link>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--border-strong)' }}>
          #{trade.transaction_id?.slice(-6)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sides.length}, 1fr)`, gap: '0.75rem' }}>
        {sides.map((side, i) => (
          <div key={i} style={{
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cream)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
              {side.teamName}
              <span style={{ color: 'var(--cream-muted)', marginLeft: '0.4rem' }}>gives</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {side.assets.map((asset, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    padding: '0.05rem 0.3rem',
                    borderRadius: 2,
                    background: asset.type === 'player' ? 'rgba(74, 133, 196, 0.15)' : 'rgba(212, 168, 67, 0.15)',
                    color: asset.type === 'player' ? '#4a85c4' : 'var(--gold)',
                  }}>
                    {asset.type === 'draft_pick' ? 'PICK' : 'PLR'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cream)' }}>
                    {asset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

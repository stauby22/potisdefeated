import { useEffect, useMemo, useState } from 'react'
import Panel from '../components/ui/Panel'
import SortableTable from '../components/ui/SortableTable'
import PlayerCard from '../components/ui/PlayerCard'

const POS_COLORS = {
  QB: '#c45050',
  RB: '#5fa05a',
  WR: '#4a85c4',
  TE: '#c4a850',
  K:  '#8a8a8a',
  DEF: '#8a5a8a',
  DST: '#8a5a8a',
}

const ORIGIN_LABELS = {
  draft: 'Draft',
  waiver: 'Waiver',
  free_agent: 'Free Agent',
  unknown: 'Unknown',
}

const BASE = import.meta.env.BASE_URL || '/'

export default function KeeperValues() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filterOwner, setFilterOwner] = useState('')
  const [filterPos, setFilterPos] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // selected row for modal

  useEffect(() => {
    fetch(`${BASE}keeper_values_S13.json`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load keeper data (${r.status})`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
  }, [])

  const owners = useMemo(() => {
    if (!data) return []
    return [...new Set(data.rows.map(r => r.current_owner))].sort()
  }, [data])

  const positions = useMemo(() => {
    if (!data) return []
    return [...new Set(data.rows.map(r => r.position).filter(Boolean))].sort()
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.rows
      .filter(r => {
        if (filterOwner && r.current_owner !== filterOwner) return false
        if (filterPos && r.position !== filterPos) return false
        if (q && !r.player_name?.toLowerCase().includes(q)) return false
        return true
      })
      // Inject a sortable cost so ineligible players sink to the bottom regardless of sort direction —
      // 99 sorts after any real round when ascending; original cost is preserved on `_cost` for display.
      .map(r => ({
        ...r,
        s13_keeper_cost_round: r.eligible === false ? 99 : r.s13_keeper_cost_round,
      }))
  }, [data, filterOwner, filterPos, search])

  const columns = useMemo(() => ([
    { key: 'current_owner', label: 'Manager', defaultDesc: false },
    {
      key: 'player_name',
      label: 'Player',
      defaultDesc: false,
      render: (v, row) => (
        <button
          type="button"
          onClick={() => setSelected(row)}
          className="player-link"
          title="Click for transaction history"
        >
          {v}
          {row.acquired_via_trade === 'Y' && (
            <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--gold-muted)' }} title="Acquired via trade in current chain">⇄</span>
          )}
        </button>
      ),
    },
    {
      key: 'position', label: 'Pos', defaultDesc: false,
      render: (v) => (
        <span style={{ color: POS_COLORS[v] || 'var(--cream-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 'bold' }}>{v || '—'}</span>
      ),
    },
    {
      key: 'nfl_team', label: 'NFL', defaultDesc: false,
      render: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cream-muted)' }}>{v || '—'}</span>
      ),
    },
    {
      key: 'chain_origin', label: 'Origin', defaultDesc: false,
      render: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cream-muted)' }}>{ORIGIN_LABELS[v] || v || '—'}</span>
      ),
    },
    {
      key: 's13_keeper_cost_round', label: 'S13 Cost', numeric: true, defaultDesc: false,
      render: (_v, row) => {
        if (row.eligible === false) {
          return (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 'bold',
              color: 'var(--crimson)', letterSpacing: '0.05em',
            }}>NOT ELIGIBLE</span>
          )
        }
        const v = row.s13_keeper_cost_round
        if (v === '' || v == null || v === 99) return <span style={{ color: 'var(--border)' }}>—</span>
        return (
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--gold)' }}>
            R{v}
          </span>
        )
      },
    },
  ]), [])

  if (error) {
    return <div className="page"><Panel><p className="text-crimson">{error}</p></Panel></div>
  }
  if (!data) {
    return <div className="page"><Panel><p className="text-mono text-sm">Loading keeper values…</p></Panel></div>
  }

  const generated = data.generated_at ? new Date(data.generated_at).toLocaleString() : null

  return (
    <div className="page">
      <div className="page-title flex align-center justify-between wrap gap-2">
        <h2>Season 13 Keeper Values</h2>
        <div className="flex gap-1 wrap">
          <input
            type="text"
            placeholder="Search player…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-panel-alt)', color: 'var(--cream)',
              border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius)',
              padding: '0.4rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', minWidth: '160px',
            }}
          />
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">All managers</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterPos} onChange={e => setFilterPos(e.target.value)}>
            <option value="">All positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <Panel>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cream-muted)', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--gold)' }}>How to read this:</strong> "S13 Cost" = the round you'd give up to keep the player.
          Lower round = more expensive (R1 = first-rounder). Click any column header to sort.
          <strong> Click a player name</strong> to see their full transaction history.
          A <span style={{ color: 'var(--gold-muted)' }}>⇄</span> next to a name means the current manager acquired the player via trade.
          Players marked <span style={{ color: 'var(--crimson)', fontWeight: 'bold' }}>NOT ELIGIBLE</span> can't be kept — the keeper formula would put their cost below round 1.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)', marginBottom: '1rem' }}>
          Showing <strong>{filtered.length}</strong> of {data.rows.length} players
          {generated && <> · Generated {generated}</>}
        </p>
        <SortableTable columns={columns} data={filtered} defaultSort="current_owner" />
      </Panel>

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)' }}>
        {Object.entries(POS_COLORS).map(([pos, color]) => (
          <span key={pos} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
            {pos}
          </span>
        ))}
      </div>

      {selected && (
        <PlayerCard player={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

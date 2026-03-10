import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { CURRENT_SEASON, SEASON_YEAR, YEAR_SEASON } from '../services/DataService'
import Panel from '../components/ui/Panel'

const POS_COLORS = {
  QB: '#c45050',
  RB: '#5fa05a',
  WR: '#4a85c4',
  TE: '#c4a850',
  K:  '#8a8a8a',
  DEF: '#8a5a8a',
  DST: '#8a5a8a',
}

const SEASONS_WITH_DRAFT = Array.from({ length: CURRENT_SEASON }, (_, i) => ({
  season: i + 1,
  year: SEASON_YEAR(i + 1)
})).reverse()

export default function DraftHistory() {
  const { db } = useDatabase()
  const [year, setYear] = useState(SEASON_YEAR(CURRENT_SEASON))
  const [filterOwner, setFilterOwner] = useState('')

  const picks = useMemo(() => db ? DataService.getDraftForYear(db, year) : [], [db, year])

  // Get unique owners in this draft (in draft slot order)
  const owners = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const p of picks) {
      if (!seen.has(p.owner)) {
        seen.add(p.owner)
        list.push(p.owner)
      }
    }
    // Sort by draft slot
    return list.sort((a, b) => {
      const aSlot = picks.find(p => p.owner === a)?.draft_slot ?? 99
      const bSlot = picks.find(p => p.owner === b)?.draft_slot ?? 99
      return aSlot - bSlot
    })
  }, [picks])

  const numRounds = useMemo(() => {
    const max = picks.reduce((m, p) => Math.max(m, p.round ?? 0), 0)
    return max || 15
  }, [picks])

  // Build grid: [round][ownerIndex] = pick
  const grid = useMemo(() => {
    const g = Array.from({ length: numRounds }, () => Array(owners.length).fill(null))
    for (const pick of picks) {
      const roundIdx = (pick.round ?? 1) - 1
      const ownerIdx = owners.indexOf(pick.owner)
      if (roundIdx >= 0 && ownerIdx >= 0) {
        g[roundIdx][ownerIdx] = pick
      }
    }
    return g
  }, [picks, owners, numRounds])

  const allOwners = useMemo(() => {
    const set = new Set()
    picks.forEach(p => set.add(p.owner))
    return [...set].sort()
  }, [picks])

  return (
    <div className="page">
      <div className="page-title flex align-center justify-between wrap gap-2">
        <h2>Draft History</h2>
        <div className="flex gap-1 wrap">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {SEASONS_WITH_DRAFT.map(({ season, year: y }) => (
              <option key={y} value={y}>Season {season} ({y})</option>
            ))}
          </select>
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">All managers</option>
            {allOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {filterOwner ? (
        <OwnerPickList picks={picks.filter(p => p.owner === filterOwner)} owner={filterOwner} year={year} />
      ) : (
        <DraftBoard grid={grid} owners={owners} numRounds={numRounds} />
      )}

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)' }}>
        {Object.entries(POS_COLORS).map(([pos, color]) => (
          <span key={pos} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
            {pos}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(212,168,67,0.3)', border: '1px solid var(--gold)', display: 'inline-block' }} />
          KEEPER
        </span>
      </div>
    </div>
  )
}

function DraftBoard({ grid, owners, numRounds }) {
  return (
    <Panel>
      <div className="draft-board">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: '2.5rem' }}>Rd</th>
              {owners.map(o => (
                <th key={o} style={{ minWidth: '110px' }}>
                  <Link to={`/owner/${o.toLowerCase()}`} style={{ color: 'var(--cream-muted)' }}>{o}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, roundIdx) => (
              <tr key={roundIdx}>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cream-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {roundIdx + 1}
                </td>
                {row.map((pick, ownerIdx) => (
                  <td key={ownerIdx} style={{ padding: '0.3rem 0.5rem', verticalAlign: 'top' }}>
                    {pick ? <PickCell pick={pick} /> : <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function PickCell({ pick }) {
  const posColor = POS_COLORS[pick.position] || 'var(--cream-muted)'
  return (
    <div className={`draft-pick ${pick.is_keeper ? 'draft-pick--keeper' : ''}`}>
      <div className="draft-pick__name" style={{ fontSize: '0.75rem' }}>
        {pick.name || `${pick.first_name} ${pick.last_name}`}
      </div>
      <div className="draft-pick__pos" style={{ color: posColor }}>
        {pick.position} · {pick.team || '—'}
        {pick.is_keeper ? ' ★' : ''}
      </div>
    </div>
  )
}

function OwnerPickList({ picks, owner, year }) {
  return (
    <Panel title={`${owner}'s ${year} Draft`}>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pick</th>
              <th>Rd</th>
              <th>Player</th>
              <th>Pos</th>
              <th>NFL Team</th>
              <th>Keeper?</th>
            </tr>
          </thead>
          <tbody>
            {picks.map(p => (
              <tr key={p.pick_no} style={{ background: p.is_keeper ? 'rgba(212,168,67,0.05)' : undefined }}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>#{p.pick_no}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cream-muted)' }}>{p.round}</td>
                <td className="highlight">{p.name || `${p.first_name} ${p.last_name}`}</td>
                <td style={{ color: POS_COLORS[p.position] || 'var(--cream-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  {p.position}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cream-muted)' }}>{p.team}</td>
                <td>{p.is_keeper ? <span style={{ color: 'var(--gold)' }}>★ Keeper</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

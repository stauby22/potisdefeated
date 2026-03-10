import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService from '../services/DataService'
import Panel from '../components/ui/Panel'
import SortableTable from '../components/ui/SortableTable'
import { Trophies } from '../components/ui/Trophies'
import OwnerCoin from '../components/ui/OwnerCoin'

export default function AllTimeStandings() {
  const { db } = useDatabase()
  const data = useMemo(() => db ? DataService.getAllTimeStandings(db) : [], [db])

  const columns = [
    {
      key: 'owner',
      label: 'Manager',
      highlight: true,
      render: (val) => (
        <div className="flex align-center gap-1">
          <OwnerCoin name={val} size="sm" />
          <Link to={`/owner/${val?.toLowerCase()}`} style={{ color: 'var(--cream)', fontFamily: 'var(--font-mono)' }}>
            {val}
          </Link>
        </div>
      )
    },
    {
      key: 'championships',
      label: '🏆',
      numeric: true,
      defaultDesc: true,
      render: (val) => <Trophies count={val} />
    },
    {
      key: 'win_pct',
      label: 'Win %',
      numeric: true,
      defaultDesc: true,
      render: (val) => val != null ? `${val}%` : '—'
    },
    {
      key: 'total_wins',
      label: 'W',
      numeric: true,
      defaultDesc: true,
      render: (val) => <span className="text-win">{val}</span>
    },
    {
      key: 'total_losses',
      label: 'L',
      numeric: true,
      defaultDesc: false,
      render: (val) => <span className="text-loss">{val}</span>
    },
    {
      key: 'total_points_for',
      label: 'Total PF',
      numeric: true,
      defaultDesc: true,
      render: (val) => val ? Number(val).toFixed(1) : '—'
    },
    {
      key: 'total_points_against',
      label: 'Total PA',
      numeric: true,
      defaultDesc: true,
      render: (val) => val ? Number(val).toFixed(1) : '—'
    },
    {
      key: 'seasons_played',
      label: 'Seasons',
      numeric: true,
      defaultDesc: true,
    },
    {
      key: 'best_rank',
      label: 'Best Finish',
      numeric: true,
      defaultDesc: false,
      render: (val) => val === 1 ? '🥇 1st' : val ? `${val}${ordinal(val)}` : '—'
    },
    {
      key: 'avg_draft_pos',
      label: 'Avg ADP',
      numeric: true,
      defaultDesc: false,
      render: (val) => val ? Number(val).toFixed(1) : '—'
    },
  ]

  return (
    <div className="page">
      <div className="page-title">
        <h2>All-Time Standings</h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)', letterSpacing: '0.06em' }}>
          Seasons 1–12 · 2014–2025
        </span>
      </div>

      <Panel>
        <SortableTable
          columns={columns}
          data={data}
          defaultSort="championships"
        />
      </Panel>

      {/* Summary ribbons */}
      <div className="grid-3 mt-3">
        {data.slice(0, 3).map((owner, i) => {
          const medals = ['🥇', '🥈', '🥉']
          return (
            <div key={owner.owner} className="panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>{medals[i]}</div>
              <Link to={`/owner/${owner.owner.toLowerCase()}`}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--cream)', marginTop: '0.3rem' }}>
                  {owner.owner}
                </div>
              </Link>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cream-muted)', marginTop: '0.2rem' }}>
                {owner.championships} championship{owner.championships !== 1 ? 's' : ''} · {owner.win_pct}% win rate
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

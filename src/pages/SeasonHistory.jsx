import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { CURRENT_SEASON, SEASON_YEAR } from '../services/DataService'
import Panel from '../components/ui/Panel'
import { RankBadge } from '../components/ui/Trophies'
import WinLossBadge from '../components/ui/WinLossBadge'

const PLAYOFF_RESULT_LABELS = {
  championship: '🏆 Champion',
  semifinal: '🥈 Runner-up',
  quarterfinal: 'Playoffs',
}

export default function SeasonHistory() {
  const { db } = useDatabase()
  const { season: paramSeason } = useParams()
  const navigate = useNavigate()

  const [season, setSeason] = useState(paramSeason ? parseInt(paramSeason) : CURRENT_SEASON)

  useEffect(() => {
    if (paramSeason) setSeason(parseInt(paramSeason))
  }, [paramSeason])

  const seasonList = useMemo(() => db ? DataService.getSeasonList(db) : [], [db])
  const rows = useMemo(() => db ? DataService.getSeasonStandings(db, season) : [], [db, season])
  const champion = rows.find(r => r.rank === 1)

  function handleSeasonChange(e) {
    const s = parseInt(e.target.value)
    setSeason(s)
    navigate(`/seasons/${s}`)
  }

  const year = SEASON_YEAR(season)

  return (
    <div className="page">
      <div className="page-title flex align-center justify-between wrap gap-2">
        <h2>Season History</h2>
        <select value={season} onChange={handleSeasonChange}>
          {seasonList.map(s => (
            <option key={s} value={s}>Season {s} ({SEASON_YEAR(s)})</option>
          ))}
        </select>
      </div>

      {champion && (
        <div className="panel" style={{
          background: 'var(--bg-deep)',
          borderColor: 'var(--gold-muted)',
          marginBottom: '1.25rem',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.5rem' }}>🏆</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                Season {season} ({year}) Champion
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--cream)' }}>
                <Link to={`/owner/${champion.team?.toLowerCase()}`} style={{ color: 'var(--cream)' }}>
                  {champion.team}
                </Link>
              </div>
              {champion.name && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cream-muted)' }}>
                  {champion.name}
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <Stat label="Record" value={`${champion.wins}–${champion.losses}`} />
              <Stat label="Points For" value={Number(champion.points_for).toFixed(1)} />
              {champion.draft_grade && <Stat label="Draft Grade" value={champion.draft_grade} />}
            </div>
          </div>
        </div>
      )}

      <Panel title={`Season ${season} (${year}) — Final Standings`}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Manager</th>
                <th>Team Name</th>
                <th style={{ textAlign: 'right' }}>W–L</th>
                <th style={{ textAlign: 'right' }}>PF</th>
                <th style={{ textAlign: 'right' }}>PA</th>
                <th style={{ textAlign: 'right' }}>High</th>
                <th style={{ textAlign: 'right' }}>Low</th>
                {rows.some(r => r.draft_grade) && <th>Draft</th>}
                {rows.some(r => r.number_of_trades != null) && <th style={{ textAlign: 'right' }}>Trades</th>}
                {rows.some(r => r.number_of_moves != null) && <th style={{ textAlign: 'right' }}>Moves</th>}
                <th>Playoff Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.team} style={{ background: row.rank === 1 ? 'rgba(212,168,67,0.04)' : undefined }}>
                  <td><RankBadge rank={row.rank} /></td>
                  <td className="highlight">
                    <Link to={`/owner/${row.team?.toLowerCase()}`} style={{ color: 'var(--cream)' }}>
                      {row.team}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.name}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    <span className="text-win">{row.wins}</span>
                    <span className="text-muted">–</span>
                    <span className="text-loss">{row.losses}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtPts(row.points_for)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtPts(row.points_against)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--win-fg)' }}>{fmtPts(row.high_score)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--loss-fg)' }}>{fmtPts(row.low_score)}</td>
                  {rows.some(r => r.draft_grade) && (
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{row.draft_grade || '—'}</td>
                  )}
                  {rows.some(r => r.number_of_trades != null) && (
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.number_of_trades ?? '—'}</td>
                  )}
                  {rows.some(r => r.number_of_moves != null) && (
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.number_of_moves ?? '—'}</td>
                  )}
                  <td style={{ fontSize: '0.78rem' }}>
                    <PlayoffResult row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function PlayoffResult({ row }) {
  if (!row) return null
  if (row.rank === 1) return <span style={{ color: 'var(--gold)' }}>🏆 Champion</span>
  if (row.playoff_record) {
    return (
      <span style={{ color: 'var(--cream-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        {row.playoff_record}
      </span>
    )
  }
  return <span style={{ color: 'var(--cream-muted)' }}>—</span>
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--cream)' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', color: 'var(--cream-muted)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function fmtPts(val) {
  if (val == null || val === '') return '—'
  return Number(val).toFixed(1)
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../context/DatabaseContext'
import DataService, { SEASON_YEAR } from '../services/DataService'
import OwnerCoin from '../components/ui/OwnerCoin'

const SEASONS = Array.from({ length: 12 }, (_, i) => 12 - i) // 12 down to 1

function bannerUrl(season) {
  const year = SEASON_YEAR(season)
  return `/PotIsDefeated%20Banners/${year}%20Champion%20Banner.svg`
}

const POSITION_ORDER = ['QB', 'WR', 'RB', 'TE', 'K', 'D/ST', 'DEF', 'FLEX', 'W/R/T']

function sortRoster(players) {
  return [...players].sort((a, b) => {
    const ai = POSITION_ORDER.indexOf(a.position)
    const bi = POSITION_ORDER.indexOf(b.position)
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return b.points - a.points
  })
}

function RosterTable({ players, label }) {
  const sorted = useMemo(() => sortRoster(players), [players])
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--cream-muted)',
        letterSpacing: '0.08em',
        marginBottom: '0.4rem',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Player</th>
              <th style={{ textAlign: 'right' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cream-muted)', whiteSpace: 'nowrap' }}>
                  {p.position}
                </td>
                <td style={{ fontSize: '0.82rem' }}>{p.name}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: p.points > 0 ? 'var(--cream)' : 'var(--cream-muted)' }}>
                  {Number(p.points).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChampionshipDetail({ db, season }) {
  const matchup = useMemo(() => db ? DataService.getChampionshipMatchup(db, season) : [], [db, season])
  const winner = matchup.find(r => r.win == 1)
  const loser = matchup.find(r => r.win == 0)
  const week = winner?.week

  const winnerRoster = useMemo(() =>
    db && winner ? DataService.getStartersForWeek(db, winner.team, season, week) : [],
    [db, winner, season, week]
  )
  const loserRoster = useMemo(() =>
    db && loser ? DataService.getStartersForWeek(db, loser.team, season, week) : [],
    [db, loser, season, week]
  )

  if (!winner) {
    return (
      <div style={{ padding: '1.5rem', color: 'var(--cream-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        No championship data found for Season {season}.
      </div>
    )
  }

  const year = SEASON_YEAR(season)

  return (
    <div style={{ padding: '1.25rem' }}>
      {/* Score banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'var(--bg-panel-alt)',
        borderRadius: '4px',
        border: '1px solid var(--border)',
      }}>
        {/* Winner */}
        <div>
          <OwnerCoin name={winner.team} size="lg" linkable={false} style={{ margin: '0 auto 0.5rem' }} />
          <Link to={`/owner/${winner.team.toLowerCase()}`}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--cream)' }}>{winner.team}</div>
          </Link>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--win-fg)', lineHeight: 1, marginTop: '0.25rem' }}>
            {Number(winner.points_for).toFixed(2)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
            CHAMPION
          </div>
        </div>

        {/* VS */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream-muted)' }}>VS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cream-muted)', marginTop: '0.25rem' }}>
            {year} · Wk {week}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cream-muted)', marginTop: '0.15rem' }}>
            {Number(winner.abs_margin).toFixed(2)} margin
          </div>
        </div>

        {/* Loser */}
        <div>
          <OwnerCoin name={loser?.team} size="lg" linkable={false} style={{ margin: '0 auto 0.5rem' }} />
          <Link to={`/owner/${loser?.team.toLowerCase()}`}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--cream)' }}>{loser?.team}</div>
          </Link>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--cream-muted)', lineHeight: 1, marginTop: '0.25rem' }}>
            {loser ? Number(loser.points_for).toFixed(2) : '—'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cream-muted)', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
            RUNNER-UP
          </div>
        </div>
      </div>

      {/* Rosters */}
      {(winnerRoster.length > 0 || loserRoster.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <RosterTable players={winnerRoster} label={`${winner.team}'s Roster`} />
          {loser && <RosterTable players={loserRoster} label={`${loser.team}'s Roster`} />}
        </div>
      )}
    </div>
  )
}

export default function Championships() {
  const { db } = useDatabase()
  const [selectedSeason, setSelectedSeason] = useState(null)

  // Pre-load champion names for all seasons for banner labels
  const champions = useMemo(() => {
    if (!db) return {}
    const result = {}
    for (const season of SEASONS) {
      const matchup = DataService.getChampionshipMatchup(db, season)
      const winner = matchup.find(r => r.win == 1)
      if (winner) result[season] = winner.team
    }
    return result
  }, [db])

  function handleBannerClick(season) {
    setSelectedSeason(prev => prev === season ? null : season)
  }

  return (
    <div className="page">
      <div className="page-title">
        <h2>Champions</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {SEASONS.map(season => {
          const year = SEASON_YEAR(season)
          const isSelected = selectedSeason === season
          return (
            <button
              key={season}
              onClick={() => handleBannerClick(season)}
              style={{
                background: 'none',
                border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '6px',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.1s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--cream-muted)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <img
                src={bannerUrl(season)}
                alt={`${year} Championship Banner`}
                style={{
                  width: '100%',
                  maxHeight: '280px',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cream-muted)' }}>
                Season {season} · {year}
              </div>
              {champions[season] && (
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--gold)' }}>
                  {champions[season]}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedSeason && (
        <div className="panel" style={{ borderColor: 'var(--gold)', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--gold)' }}>
              {SEASON_YEAR(selectedSeason)} Championship — Season {selectedSeason}
            </div>
            <button
              onClick={() => setSelectedSeason(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cream-muted)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: '0.2rem 0.4rem',
              }}
            >
              ✕
            </button>
          </div>
          <ChampionshipDetail db={db} season={selectedSeason} />
        </div>
      )}
    </div>
  )
}

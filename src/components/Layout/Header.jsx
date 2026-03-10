import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={{
      background: 'var(--bg-deep)',
      borderBottom: '2px solid var(--crimson)',
      padding: '1rem 1.25rem',
    }}>
      <div className="container flex align-center justify-between">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            color: 'var(--cream)',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}>
            Pot Is Defeated
          </h1>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: 'var(--cream-muted)',
            textTransform: 'uppercase',
            marginTop: '0.2rem',
          }}>
            Seasons 1–12 · 2014–2025
          </div>
        </Link>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          color: 'var(--cream-muted)',
          textAlign: 'right',
          lineHeight: 1.5,
        }}>
          <div style={{ color: 'var(--gold)' }}>S12 CHAMPION</div>
          <div style={{ color: 'var(--cream)', fontSize: '0.78rem' }}>Blake 🏆</div>
        </div>
      </div>
    </header>
  )
}

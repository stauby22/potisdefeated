import { Outlet } from 'react-router-dom'
import Header from './Header'
import Nav from './Nav'
import { useDatabase } from '../../context/DatabaseContext'

export default function Layout() {
  const { loading, error } = useDatabase()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream-muted)', fontSize: '1rem', letterSpacing: '0.08em' }}>
            LOADING THE VAULT...
          </h2>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>11 seasons of pain and glory</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div className="panel" style={{ maxWidth: 400, textAlign: 'center' }}>
          <h2 className="text-crimson mb-2">Database Error</h2>
          <p className="text-mono text-sm">{error}</p>
          <p className="mt-2 text-xs text-muted">Make sure PotIsDefeated.db is in the public/ folder.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Nav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--cream-muted)',
        letterSpacing: '0.05em'
      }}>
        POT IS DEFEATED &mdash; SEASONS 1–12 &mdash; 2014–2025
      </footer>
    </div>
  )
}

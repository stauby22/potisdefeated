import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Home',      end: true },
  { to: '/standings', label: 'Standings'  },
  { to: '/seasons',   label: 'Seasons'    },
  { to: '/matchups',  label: 'Matchups'   },
  { to: '/draft',     label: 'Draft'      },
  { to: '/h2h',       label: 'H2H'        },
  { to: '/records',   label: 'Records'    },
  { to: '/trades',    label: 'Trades'     },
]

export default function Nav() {
  return (
    <nav style={{
      background: 'var(--bg-panel-alt)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
    }}>
      <div className="container" style={{ display: 'flex', gap: '0.15rem', padding: '0.4rem 1rem' }}>
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

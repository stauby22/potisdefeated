import { Link } from 'react-router-dom'

const INITIALS = name => name ? name.slice(0, 2).toUpperCase() : '?'

// Stable hue per owner name (for distinct colors)
const nameHue = name => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  // Avoid the green range (site background) — shift it
  if (h > 100 && h < 170) h = (h + 60) % 360
  return h
}

export default function OwnerCoin({ name, size = 'md', avatar, linkable = true }) {
  const hue = nameHue(name || '')
  const bg = `hsl(${hue}, 30%, 22%)`
  const border = `hsl(${hue}, 25%, 40%)`

  const sizeClass = size === 'sm' ? 'owner-coin--sm' : size === 'lg' ? 'owner-coin--lg' : ''

  const coin = (
    <div
      className={`owner-coin ${sizeClass}`}
      style={{ background: bg, borderColor: border }}
      title={name}
    >
      {avatar
        ? <img src={avatar} alt={name} onError={e => { e.target.style.display = 'none' }} />
        : INITIALS(name)
      }
    </div>
  )

  if (linkable && name) {
    return <Link to={`/owner/${name.toLowerCase()}`}>{coin}</Link>
  }
  return coin
}

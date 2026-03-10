export default function WinLossBadge({ win, label }) {
  if (label !== undefined) {
    return <span className={`badge badge--${win ? 'win' : 'loss'}`}>{label}</span>
  }
  return <span className={`badge badge--${win ? 'win' : 'loss'}`}>{win ? 'W' : 'L'}</span>
}

export function RecordBadge({ wins, losses }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
      <span className="text-win">{wins}</span>
      <span className="text-muted">–</span>
      <span className="text-loss">{losses}</span>
    </span>
  )
}

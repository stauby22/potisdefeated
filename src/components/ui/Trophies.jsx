export function Trophies({ count }) {
  if (!count) return null
  return (
    <span className="trophy-row" title={`${count} championship${count !== 1 ? 's' : ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="trophy">🏆</span>
      ))}
    </span>
  )
}

export function RankBadge({ rank }) {
  let cls = 'rank-badge--n'
  if (rank === 1) cls = 'rank-badge--1'
  else if (rank === 2) cls = 'rank-badge--2'
  else if (rank === 3) cls = 'rank-badge--3'
  return <span className={`rank-badge ${cls}`}>{rank}</span>
}

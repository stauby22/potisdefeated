import { useState, useMemo } from 'react'

/**
 * columns: [{ key, label, render?, numeric?, defaultDesc? }]
 * data: array of row objects
 */
export default function SortableTable({ columns, data, defaultSort, className = '' }) {
  const initialSort = defaultSort || columns[0]?.key
  const initialDir = columns.find(c => c.key === initialSort)?.defaultDesc !== false ? 'desc' : 'asc'

  const [sortKey, setSortKey] = useState(initialSort)
  const [sortDir, setSortDir] = useState(initialDir)

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      const col = columns.find(c => c.key === key)
      setSortDir(col?.defaultDesc !== false ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  return (
    <div className={`table-wrapper ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`sortable${sortKey === col.key ? ' sort-active' : ''}`}
                onClick={() => handleSort(col.key)}
                title={`Sort by ${col.label}`}
                style={{ textAlign: col.numeric ? 'right' : 'left' }}
              >
                {col.label}
                {sortKey === col.key && (
                  <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{ textAlign: col.numeric ? 'right' : 'left' }}
                  className={col.highlight ? 'highlight' : ''}
                >
                  {col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--cream-muted)', padding: '1.5rem' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

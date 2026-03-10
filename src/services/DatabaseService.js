/**
 * Low-level SQLite helpers.
 * UI components never use these directly — go through DataService.
 */

/**
 * Run a parameterized query, return array of plain objects.
 */
export function queryAll(db, sql, params = []) {
  if (!db) return []
  try {
    if (params.length > 0) {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()
      return rows
    } else {
      const results = db.exec(sql)
      if (!results.length) return []
      const { columns, values } = results[0]
      return values.map(row =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
      )
    }
  } catch (e) {
    console.error('SQL error:', e.message, '\nQuery:', sql, '\nParams:', params)
    return []
  }
}

/**
 * Return first row or null.
 */
export function queryOne(db, sql, params = []) {
  return queryAll(db, sql, params)[0] ?? null
}

/**
 * Return a single scalar value from the first column of the first row.
 */
export function queryScalar(db, sql, params = []) {
  const row = queryOne(db, sql, params)
  if (!row) return null
  return Object.values(row)[0]
}

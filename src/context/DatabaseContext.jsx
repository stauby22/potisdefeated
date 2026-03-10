import { createContext, useContext, useEffect, useState } from 'react'
import initSqlJs from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const DatabaseContext = createContext(null)

export function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function initDb() {
      try {
        const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })

        // Cache-bust from db_version.txt
        let version = 'v1'
        try {
          const vRes = await fetch('/db_version.txt')
          if (vRes.ok) version = (await vRes.text()).trim()
        } catch {
          // fall back to default version
        }

        const response = await fetch(`/PotIsDefeated.db?v=${version}`)
        if (!response.ok) throw new Error(`Failed to load database (${response.status})`)

        const buffer = await response.arrayBuffer()
        const database = new SQL.Database(new Uint8Array(buffer))
        setDb(database)
      } catch (err) {
        console.error('Database init error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initDb()
  }, [])

  return (
    <DatabaseContext.Provider value={{ db, loading, error }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  return useContext(DatabaseContext)
}

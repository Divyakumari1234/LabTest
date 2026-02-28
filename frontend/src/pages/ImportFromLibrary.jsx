
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLibraryTests, listLabTests, createLabTest } from '../services/api'

export default function ImportFromLibrary() {
  const [library, setLibrary] = useState([])
  const [presentSet, setPresentSet] = useState(new Set())
  const [fees, setFees] = useState({})
  const [adding, setAdding] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const norm = (s='') => s.trim().toLowerCase()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        const existing = await listLabTests({ page: 1, limit: 5000, fields: 'name' })
        const set = new Set(existing.items.map(x => norm(x.name)))
        if (!alive) return
        setPresentSet(set)
        const lib = await listLibraryTests({ page, limit: 16 })
        if (!alive) return
        setLibrary(lib.items || [])
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load library')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [page])

  const rows = useMemo(
    () => library.map((r, i) => ({ sno: i + 1 + (page - 1) * 16, ...r })),
    [library, page]
  )

  const handleAdd = async (row) => {
    const key = norm(row.name)
    if (presentSet.has(key)) return

    try {
      setAdding(a => ({ ...a, [row._id]: true }))
      const feeRaw = (fees[row._id] ?? '').toString().trim()
      const price = feeRaw ? Number(feeRaw) : 0

      const resp = await createLabTest({
        name: row.name,
        shortName: row.shortName || '',
        category: row.category,
        price
      })
      if (resp?.error) throw new Error(resp.error)

      setPresentSet(prev => new Set(prev).add(key))
      window.dispatchEvent(new CustomEvent('labtests:changed', {
        detail: { action: resp?.already ? 'noop' : 'created', name: row.name }
      }))
    } catch (e) {
      alert(e.message || 'Failed to add test')
    } finally {
      setAdding(a => ({ ...a, [row._id]: false }))
    }
  }

  return (
    <div className="w-full bg-gray-50">
      <div className="p-6">
        <div className="text-sm text-blue-700 mb-4">
          <Link to="/lab/database" className="hover:underline">Test database</Link>
          <span className="text-gray-400"> &nbsp;&gt;&nbsp; </span>
          <Link to="/lab/database/add" className="hover:underline">Select type</Link>
          <span className="text-gray-400"> &nbsp;&gt;&nbsp; </span>
          <span className="text-gray-600">Import tests</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Import test from library</h1>
          <span className="text-[11px] px-2 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
            Recommended
          </span>
        </div>
        <p className="text-gray-600 mb-4">
          Library consists of specialized tests. If you don’t find a test, you can
          <Link to="/lab/database/add" className="text-blue-700 underline ml-1">add it manually</Link>.
        </p>

        {loading && <div className="bg-white border rounded-lg p-6">Loading…</div>}
        {error && !loading && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{error}</div>}

        {!loading && !error && (
          <>
            <div className="bg-white border rounded-lg overflow-x-auto">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="bg-gray-100">
                  <tr className="text-left text-gray-700">
                    <th className="px-4 py-3 w-20">SNO.</th>
                    <th className="px-4 py-3">NAME</th>
                    <th className="px-4 py-3 w-56">CATEGORY</th>
                    <th className="px-4 py-3 w-72">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const already = presentSet.has(norm(row.name))
                    return (
                      <tr key={row._id} className="border-t">
                        <td className="px-4 py-3 text-gray-600">{row.sno}.</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-gray-700">{row.category}</td>
                        <td className="px-4 py-3">
                          {already ? (
                            <span className="text-gray-500">Already present</span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <input
                                value={fees[row._id] ?? ''}
                                onChange={e => setFees(f => ({ ...f, [row._id]: e.target.value }))}
                                placeholder="Fee"
                                className="w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                              <button
                                onClick={() => handleAdd(row)}
                                disabled={!!adding[row._id]}
                                className={`px-4 py-2 rounded-md font-semibold transition-colors
                                  ${adding[row._id]
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                              >
                                {adding[row._id] ? 'Adding…' : 'Add'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 border rounded hover:bg-gray-50">Prev</button>
              <span className="text-gray-600">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded hover:bg-gray-50">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

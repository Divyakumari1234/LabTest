import React from 'react'
import { useNavigate } from 'react-router-dom'
import { listPanels } from '../services/api'

export default function TestPanels() {
  const navigate = useNavigate()
  const [rows, setRows] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [open, setOpen] = React.useState({}) 

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        const res = await listPanels({
          page: 1,
          limit: 5000,
          sort: 'order',
          fields: 'order,name,category,tests,price'
        })
        if (!alive) return
        setRows(Array.isArray(res?.items) ? res.items : [])
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load panels')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const toggleOpen = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))

  const fmtPrice = (v) => {
    if (v === null || v === undefined || v === '') return '—'
    const num = Number(v)
    if (Number.isNaN(num)) return String(v)
    return `₹${num.toLocaleString()}`
  }

  return (
    <div className="w-full">

      {loading && (
        <div className="bg-white border rounded-xl p-6 text-gray-700">Loading…</div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed">
            <colgroup><col style={{ width: '5.5rem' }} /><col style={{ width: '16rem' }} /><col style={{ width: '12rem' }} /><col /><col style={{ width: '8rem' }} /><col style={{ width: '10rem' }} /></colgroup>

            <thead className="bg-green-50 text-gray-700">
              <tr className="text-left">
                <th className="px-4 py-3">ORDER</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">CATEGORY</th>
                <th className="px-4 py-3">TESTS</th>
                <th className="px-4 py-3">PRICE</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>

            <tbody className="text-gray-900">
              {rows.map((r, idx) => {
                const tests = Array.isArray(r.tests) ? r.tests : []
                const firstTwo = tests.slice(0, 2)
                const remaining = tests.slice(2)
                const hasMore = remaining.length > 0
                const isOpen = !!open[r._id || idx]

                return (
                  <tr key={r._id || idx} className="border-t align-top">
                    {/* ORDER */}
                    <td className="px-4 py-3 text-gray-700">
                      {(r?.order ?? idx + 1)}.
                    </td>

                    {/* NAME */}
                    <td className="px-4 py-3 font-medium truncate">
                      {r?.name || '—'}
                    </td>

                    {/* CATEGORY */}
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-1">
                        {r?.category || '—'}
                      </span>
                    </td>

                     
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="whitespace-normal">
                          {firstTwo.join(', ') || '—'}
                          {!isOpen && hasMore && (
                            <button
                              type="button"
                              onClick={() => toggleOpen(r._id || idx)}
                              className="ml-2 text-blue-700 hover:underline"
                            >
                              ({tests.length} {tests.length === 1 ? 'test' : 'tests'})
                            </button>
                          )}
                        </div>

                        {isOpen && hasMore && (
                          <div className="whitespace-normal text-gray-800">
                            {remaining.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtPrice(r?.price)}
                    </td>

                    {/* ACTIONS (right corner) */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-5">
                        <button
                          onClick={() => {
                            const id = r._id || idx
                            navigate(`/lab/panels/new?id=${encodeURIComponent(id)}`)
                          }}
                          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.293.195l-3 1a1 1 0 01-1.273-1.273l1-3a1 1 0 01.195-.293l9.9-9.9zM12 5l3 3" />
                          </svg>
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            const id = r._id || idx
                            navigate(`/lab/panels/${encodeURIComponent(id)}`)
                          }}
                          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3c-4 0-7.333 2.667-9 7 1.667 4.333 5 7 9 7s7.333-2.667 9-7c-1.667-4.333-5-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
                          </svg>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

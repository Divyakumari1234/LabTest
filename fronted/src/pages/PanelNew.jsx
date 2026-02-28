
// fronted/src/pages/PanelNew.jsx
import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPanel, getPanel, updatePanel } from '../services/api' // ✅ FIX path (was ./services/api)

function CategoryDropdown({ value, onChange, options }) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)
  const btnRef = React.useRef(null)

  React.useEffect(() => {
    const onDoc = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [])

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full rounded-md border px-3 py-2 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {value || 'Choose a category'}
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-lg" role="listbox">
          {options.map(opt => (
            <li
              key={opt}
              role="option"
              onClick={() => { onChange(opt); setOpen(false); btnRef.current?.focus() }}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                value === opt ? 'bg-blue-600 text-white hover:bg-blue-600' : ''
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TestsDropdownMulti({ value = [], onChange, options = [], placeholder = 'Search tests…' }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const rootRef = React.useRef(null)
  const inputRef = React.useRef(null)

  const norm = s => (s || '').trim()
  const uniqPush = (arr, item) => {
    const n = norm(item)
    if (!n) return arr
    const exists = arr.some(t => norm(t).toLowerCase() === n.toLowerCase())
    return exists ? arr : [...arr, n] // ✅ FIX
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const selected = new Set(value.map(v => (v || '').toLowerCase()))
    return options
      .filter(opt => opt && !selected.has(opt.toLowerCase()))
      .filter(opt => !q || opt.toLowerCase().includes(q))
      .slice(0, 200)
  }, [options, value, query])

  React.useEffect(() => {
    const onDoc = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const addItems = items => {
    let next = value
    items.forEach(it => { next = uniqPush(next, it) })
    onChange(next)
  }

  const addFromQuery = () => {
    const t = norm(query)
    if (!t) return
    addItems([t])
    setQuery('')
  }

  const removeAt = idx => {
    const next = value.slice()
    next.splice(idx, 1)
    onChange(next)
  }

  const onKeyDown = e => {
    if (e.key === 'Enter') { e.preventDefault(); addFromQuery() }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v, idx) => (
          <span key={`${v}-${idx}`} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 border">
            <span className="text-sm">{v}</span>
            <button type="button" className="text-xs text-red-600" onClick={() => removeAt(idx)}>✕</button>
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">No match. Press Enter to add.</li>
          ) : (
            filtered.map(opt => (
              <li
                key={opt}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { addItems([opt]); setQuery(''); inputRef.current?.focus() }}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50"
                title={opt}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default function PanelNew() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const editingId = search.get('id') || null

  const [form, setForm] = React.useState({
    name: '',
    category: '',
    price: '',
    hideInterp: true,
    hideMethod: false,
    tests: [],
    interpretation: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(!!editingId)

  const CATEGORY_OPTIONS = [
    'Miscellaneous','Others','Histopathology','Endocrinology','Microbiology',
    'Cytology','Clinical Pathology','Serology & Immunology','Biochemistry','Haematology',
  ]

  // ✅ Load existing panel when editing
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      if (!editingId) return
      try {
        setLoading(true); setError('')
        const data = await getPanel(editingId)
        if (!alive) return
        if (!data) throw new Error('Panel not found')
        setForm({
          name: data?.name || '',
          category: data?.category || '',
          price: (data?.price ?? '').toString(),
          hideInterp: !!data?.options?.hideInterpretation,
          hideMethod: !!data?.options?.hideMethod,
          tests: Array.isArray(data?.tests) ? data.tests : [],
          interpretation: data?.interpretation || '',
        })
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load panel')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [editingId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Name is required')
    if (!form.category.trim()) return setError('Category is required')

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: form.price ? Number(form.price) : 0,
      options: { hideInterpretation: !!form.hideInterp, hideMethod: !!form.hideMethod },
      tests: Array.isArray(form.tests) ? form.tests : [],
      interpretation: form.interpretation || '',
    }

    try {
      setSaving(true)
      if (editingId) await updatePanel(editingId, payload)
      else await createPanel(payload)
      navigate('/lab/panels')
    } catch (e) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="bg-white border rounded-lg p-6">Loading…</div>

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-4 text-xs font-medium text-gray-500">
        <Link to="/lab/panels" className="uppercase tracking-wide hover:underline">ALL PANELS</Link>
        <span className="mx-2">/</span>
        <span className="uppercase tracking-wide">{editingId ? 'EDIT PANEL' : 'ADD NEW PANEL'}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <div className="mt-1">
            <CategoryDropdown
              value={form.category}
              options={CATEGORY_OPTIONS}
              onChange={(v) => setForm(s => ({ ...s, category: v }))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Tests</label>
          <div className="mt-1">
            <TestsDropdownMulti
              value={form.tests}
              options={[]}   // (you can feed options from backend later)
              onChange={(next) => setForm(s => ({ ...s, tests: next }))}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate('/lab/panels')} className="px-4 py-2 border rounded-md font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

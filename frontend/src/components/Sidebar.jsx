import React from 'react'
import { NavLink } from 'react-router-dom'

const itemClass = ({ isActive }) =>
  `block w-full text-left px-4 py-2 rounded-md transition-colors
   text-[15px] md:text-[16px] font-semibold
   ${isActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-gray-800'}`

export default function Sidebar({ mobileOpen = false, onClose, onNavigate }) {
  const [open, setOpen] = React.useState(() => {
    try {
      const saved = localStorage.getItem('lab:isOpen')
      return saved === null ? true : saved === '1'
    } catch {
      return true
    }
  })

  const toggle = () => {
    setOpen((v) => {
      const next = !v
      try {
        localStorage.setItem('lab:isOpen', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  return (
    <aside
      className={`w-[220px] sm:w-[240px] bg-[#f3f8ff] border-r shrink-0
        fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
    >
      <div className="px-4 py-4 min-h-[72px] border-b border-gray-200 relative">
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between select-none"
          aria-expanded={open}
          aria-controls="lab-section"
        >
          <h2 className="text-2xl font-bold text-blue-800">Lab</h2>

          <svg
            className={`w-5 h-5 text-blue-800 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 9l6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full border border-blue-200 text-blue-800 bg-white"
          aria-label="Close sidebar"
        >
          X
        </button>
      </div>
    
      <div
        id="lab-section"
        className={`
          overflow-hidden transition-[max-height] duration-300 ease-in-out
          ${open ? 'max-h-[1000px]' : 'max-h-0'}
        `}
      >
        <nav className="px-3 py-3 space-y-1">
          <NavLink to="/lab/reports" className={itemClass} onClick={onNavigate}>
            Clinic reports
          </NavLink>
          <NavLink to="/lab/search" className={itemClass} onClick={onNavigate}>
            Search reports
          </NavLink>
          <NavLink to="/lab/packages" className={itemClass} onClick={onNavigate}>
            Test packages
          </NavLink>
          <NavLink to="/lab/panels" className={itemClass} onClick={onNavigate}>
            Test panels
          </NavLink>
          <NavLink to="/lab/categories" className={itemClass} onClick={onNavigate}>
            Test categories
          </NavLink>
          <NavLink to="/lab/database" className={itemClass} onClick={onNavigate}>
            Test database
          </NavLink>
    
          <NavLink to="/lab/interpretations" className={itemClass} onClick={onNavigate}>
            Interpretations
          </NavLink>
          <NavLink to="/lab/counts" className={itemClass} onClick={onNavigate}>        
            Test counts
          </NavLink>
        </nav>
      </div>
    </aside>
  )
}














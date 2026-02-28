// src/pages/AddTestType.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function AddTestType() {
  const navigate = useNavigate()

  const ManualRow = ({ n, title, sub, to }) => (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-start gap-4 py-4 hover:bg-gray-50 rounded-md px-3 text-left transition-colors"
    >
      <span className="min-w-7 h-7 flex items-center justify-center text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">
        {n}
      </span>
      <div>
        <div className="font-semibold text-gray-800">{title}</div>
        {sub && <div className="text-sm text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </button>
  )

  return (
    <div className="w-full bg-gray-50">
      <div className="p-6">
        <div className="text-sm text-blue-700 mb-4">
          <Link to="/lab/database" className="hover:underline">Test database</Link>
          <span className="text-gray-400"> &nbsp;&gt;&nbsp; </span>
          <span className="text-gray-600">Select type</span>
        </div>
        <div className="grid gap-8 items-stretch grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
          <div className="bg-white border rounded-xl shadow-sm p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Import test from library</h2>
              <span className="text-[11px] px-2 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                Recommended
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-600 max-w-lg mb-8">
                Library consists of many tests ready to use. You can preview the test
                details and import them.
              </p>

              <button
                onClick={() => navigate('/lab/database/add/library')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center px-2">
            <div className="flex flex-col items-center">
              <span className="text-yellow-500 font-semibold">OR</span>
              <span className="w-10 h-1 rounded-full bg-yellow-200 mt-1"></span>
            </div>
          </div>

          
          <div className="bg-white border rounded-xl shadow-sm p-8 h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add test manually</h2>

            <div className="divide-y">
              <ManualRow
                n="1"
                title="Single parameter"
                sub="Eg. HB, TLC"
                to="/lab/database/add/manual/single"
              />
              <ManualRow
                n="2"
                title="Multiple parameters"
                sub="Eg. DLC, Blood group"
                to="/lab/database/add/manual/multi"
              />
              <ManualRow
                n="3"
                title="Multiple nested parameters"
                sub="Eg. Urine routine, Semen Examination"
                to="/lab/database/add/manual/nested"
              />
              <ManualRow
                n="4"
                title="Document"
                sub="Eg. FNAC, histo-pathology reports, culture and sensitivity reports"
                to="/lab/database/add/manual/document"
              />
            </div>

          
            <div className="mt-6 p-4 rounded-lg bg-gray-50 border text-gray-700">
              <div className="font-semibold mb-1">Customization</div>
              <p className="text-sm text-gray-600">
                If you are unable to customize yourself, you can avail customization service.
                <button
                  onClick={() => navigate('/lab/database/add/help')}
                  className="ml-1 text-blue-700 hover:underline"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

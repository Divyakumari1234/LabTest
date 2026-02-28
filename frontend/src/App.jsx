
import React from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import TestDatabase from "./pages/TestDatabase.jsx";
import AddTestType from "./pages/AddTestType.jsx";
import ImportFromLibrary from "./pages/ImportFromLibrary.jsx";
import TestPanels from "./pages/TestPanels.jsx";
import PanelNew from "./pages/PanelNew.jsx";
import TestPackages from "./pages/TestPackages.jsx";
import PackageNew from "./pages/PackageNew.jsx";
import Interpretations from "./pages/Interpretations.jsx";
import AddCase from "./pages/AddCase.jsx";
import SearchReports from "./pages/SearchReports.jsx";
import TestCategories from "./pages/TestCategories.jsx";

const Empty = () => (
  <div className="p-8 text-gray-500">Select a page from the “Lab” menu.</div>
);

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(true);

  const isPanels = location.pathname.startsWith("/lab/panels");
  const isDatabase = location.pathname.startsWith("/lab/database");
  const isPackages = location.pathname.startsWith("/lab/packages");
  const isCategories = location.pathname.startsWith("/lab/categories");
  const isReports = location.pathname.startsWith("/lab/reports");

  const getHeading = () => {
    if (isReports) return "Clinic Report";
    if (isPanels) return "Test Panels";
    if (isDatabase) return "Test Database";
    if (isPackages) return "Test Packages";
    if (isCategories) return "Test Categories";
    if (location.pathname.includes("/lab/search")) return "Search Reports";
    if (location.pathname.includes("/lab/interpretations")) return "Interpretations";
    return "Lab";
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-10 h-10 rounded-md border border-blue-200 text-blue-800 bg-white grid place-items-center"
              aria-label="Open sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-800 tracking-tight">
              {getHeading()}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isDatabase && (
              <button
                onClick={() => navigate("/lab/database/add")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm sm:text-base hover:bg-blue-700"
              >
                + Add Test
              </button>
            )}

            {isPanels && location.pathname === "/lab/panels" && (
              <button
                onClick={() => navigate("/lab/panels/new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm sm:text-base hover:bg-blue-700"
              >
                + Add new
              </button>
            )}

            {isPackages && (
              <button
                onClick={() => navigate("/lab/packages/add")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm sm:text-base hover:bg-blue-700"
              >
                + Add new
              </button>
            )}

            {isCategories && (
              <button
                onClick={() => navigate("/lab/categories?mode=new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm sm:text-base hover:bg-blue-700"
              >
                + Add new
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 bg-gray-50 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Empty />} />

            
            <Route path="/lab/reports" element={<AddCase />} />
            <Route path="/lab/reports/new" element={<AddCase />} />
            <Route path="/lab/database" element={<TestDatabase />} />
            <Route path="/lab/database/add" element={<AddTestType />} />
            <Route path="/lab/database/add/library"element={<ImportFromLibrary />}/>
            <Route path="/lab/panels" element={<TestPanels />} />
            <Route path="/lab/panels/new" element={<PanelNew />} />
            <Route path="/lab/packages" element={<TestPackages />} />
            <Route path="/lab/packages/add" element={<PackageNew />} />
            <Route path="/lab/interpretations" element={<Interpretations />} />
            <Route path="/lab/search" element={<SearchReports />} />
            <Route path="/lab/categories" element={<TestCategories />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

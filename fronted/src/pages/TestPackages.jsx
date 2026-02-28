import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { listPackages } from "../services/api";

function fmtINR(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function HoverCard({ open, anchorRect, tests = [], panels = [] }) {
  if (!open || !anchorRect) return null;

  const maxWidth = 1100;
  const top = Math.max(12, anchorRect.top - 12);
  const left = Math.max(
    12,
    Math.min(
      window.innerWidth - maxWidth - 12,
      anchorRect.left + anchorRect.width / 2 - maxWidth / 2
    )
  );

  return createPortal(
    <div
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 9999,
        maxWidth: `${maxWidth}px`,
        pointerEvents: "none",
      }}
    >
      <div
        className="bg-[#2f3e5c] text-white rounded-lg shadow-2xl"
        style={{
          padding: "12px 16px",
          maxHeight: 420,
          overflow: "auto",
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.4,
          pointerEvents: "auto",
        }}
      >
        {!!tests.length && (
          <div className="mb-2">
            <span className="font-semibold">Tests ({tests.length}) : </span>
            <span>{tests.join(", ")}</span>
          </div>
        )}
        {!!panels.length && (
          <div>
            <span className="font-semibold">Panels ({panels.length}) : </span>
            <span>{panels.join(", ")}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function TestPackages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const [hoverRowId, setHoverRowId] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [hoverData, setHoverData] = useState({ tests: [], panels: [] });

  const navigate = useNavigate();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPackages({ page: 1, limit: 200, sort: "order" });
      setRows(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load packages"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const onChanged = () => fetchRows();
    window.addEventListener("packages:changed", onChanged);
    return () => window.removeEventListener("packages:changed", onChanged);
  }, [fetchRows]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "i");
    return rows.filter((r) => re.test(r?.name || "") || re.test(r?.gender || ""));
  }, [rows, q]);

  const preview = (tests = [], panels = []) => {
    const parts = [];
    if (tests?.length) parts.push(tests.join(", "));
    if (panels?.length) parts.push(panels.join(", "));
    const s = parts.join(", ");
    return s ? (s.length > 110 ? s.slice(0, 110) + "…" : s) : "—";
  };

  return (
    <div className="w-full">
      {/* ✅ Header + Add new */}
      
      {/* Search (optional but useful) */}
      <div className="mb-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Search package..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && (
        <div className="bg-white border rounded-lg p-6">Loading…</div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed">
            <colgroup><col style={{ width: "6rem" }} /><col style={{ width: "24%" }} /><col style={{ width: "9rem" }} /><col style={{ width: "9rem" }} /><col /><col style={{ width: "7.5rem" }} /></colgroup>

            <thead className="bg-green-50">
              <tr className="text-left text-gray-700">
                <th className="px-4 py-3">S. NO.</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">FEE</th>
                <th className="px-4 py-3">GENDER</th>
                <th className="px-4 py-3">INCLUDED TESTS AND PANELS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length ? (
                filtered.map((r, i) => {
                  const id = r._id || i;
                  const tests = Array.isArray(r.tests) ? r.tests : [];
                  const panels = Array.isArray(r.panels) ? r.panels : [];

                  return (
                    <tr key={id} className="border-t">
                      <td className="px-4 py-3 text-gray-700">{i + 1}.</td>

                      <td className="px-4 py-3 font-medium">{r?.name || "—"}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmtINR(r?.fee)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-1">
                          {r?.gender || "Both"}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3 relative"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setAnchorRect(rect);
                          setHoverData({ tests, panels });
                          setHoverRowId(id);
                        }}
                        onMouseLeave={() => setHoverRowId(null)}
                      >
                        <div className="truncate">{preview(tests, panels)}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/lab/packages/add?id=${r._id}`)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No packages found.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      <HoverCard
        open={!!hoverRowId}
        anchorRect={anchorRect}
        tests={hoverData.tests}
        panels={hoverData.panels}
      />
    </div>
  );
}

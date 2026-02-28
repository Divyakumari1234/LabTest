// src/pages/TestDatabase.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { listLabTests } from "../services/api";

export default function TestDatabase() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeRow = (r, index) => {
    const order =
      r?.order ??
      r?.serialNo ??
      r?.serial_no ??
      r?.sNo ??
      index + 1;

    const name =
      r?.name ??
      r?.testName ??
      r?.test_name ??
      r?.title ??
      "";

    const shortName =
      r?.shortName ??
      r?.short_name ??
      r?.abbr ??
      "";

    const cat =
      r?.category ??
      r?.testCategory ??
      r?.group ??
      "Others";

    return {
      _id: r?._id ?? `${order}-${name}-${index}`,
      order,
      name,
      shortName,
      category: cat,
    };
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // NOTE: fields me dono types include kar diye (order/name + serialNo/testName)
      const res = await listLabTests({
        page: 1,
        limit: 10000,
        sort: "order",
        fields: "order,name,shortName,category,serialNo,testName,serial_no,test_name,testCategory,group",
      });

      console.log("API Response:", res); // Debug log
      
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      console.log("Items extracted:", items.length); // Debug log
      
      const normalized = items.map((r, idx) => normalizeRow(r, idx));

      // optional: order sort safe
      normalized.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      console.log("Normalized rows:", normalized.length); // Debug log
      setRows(normalized);
    } catch (err) {
      console.error("Error fetching tests:", err); // Debug log
      setError(err?.message || "Failed to load tests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const onChanged = () => fetchRows();
    window.addEventListener("labtests:changed", onChanged);
    return () => window.removeEventListener("labtests:changed", onChanged);
  }, [fetchRows]);

  const categories = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r?.category) set.add(r.category);
    });

    // aap chahein to fixed list + dynamic mix
    const fixed = [
      "Haematology",
      "Biochemistry",
      "Serology & Immunology",
      "Clinical Pathology",
      "Cytology",
      "Microbiology",
      "Endocrinology",
      "Histopathology",
      "Others",
    ];

    // fixed first, then baki jo backend se aaye
    const rest = [...set].filter((c) => !fixed.includes(c)).sort();
    return [...fixed, ...rest];
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const byCat = !category || r.category === category;
      if (!term) return byCat;

      const hay = `${r.order} ${r.name} ${r.shortName} ${r.category}`.toLowerCase();
      return byCat && hay.includes(term);
    });
  }, [rows, q, category]);

  return (
    <div className="w-full bg-gray-50">
      <div className="w-full p-4 md:p-6">
        <div className="mb-4">
          <div className="mb-2 font-semibold text-gray-800">Filter by category:</div>
          <div className="inline-flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1 rounded-md border transition ${
                category
                  ? "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  : "bg-blue-600 text-white border-blue-600"
              }`}
            >
              All
            </button>

            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory((prev) => (prev === c ? "" : c))}
                className={`px-3 py-1 rounded-md border transition ${
                  category === c
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
                title={c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order / name / short name / category"
            className="w-full md:w-1/2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {loading && (
          <div className="text-gray-600 bg-white border rounded-lg shadow-sm p-6">
            Loading tests…
          </div>
        )}

        {error && !loading && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
              <thead className="bg-green-50">
                <tr className="text-left text-gray-700">
                  <th className="px-4 py-3 w-24 font-semibold">ORDER</th>
                  <th className="px-4 py-3 font-semibold">NAME</th>
                  <th className="px-4 py-3 w-56 font-semibold">SHORT NAME</th>
                  <th className="px-4 py-3 w-56 font-semibold">CATEGORY</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((r) => (
                    <tr key={r._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{r.order}.</td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {r.name || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {r.shortName || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-1">
                          {r.category || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

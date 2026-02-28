// src/pages/SearchReports.jsx
import React, { useState, useMemo, useEffect } from "react";
import { listReports, updateReport } from "../services/api";

const TEST_META = {
  Hemoglobin: { unit: "g/dl", reference: "13 - 17" },
  "Hemoglobin (Hb)": { unit: "g/dl", reference: "13 - 17" },
  "Total Leukocyte Count": { unit: "cumm", reference: "4,800 - 10,800" },
  "Total Leukocyte Count (TLC)": { unit: "cumm", reference: "4,800 - 10,800" },
  Neutrophils: { unit: "%", reference: "40 - 80" },
  Lymphocyte: { unit: "%", reference: "20 - 40" },
  Eosinophils: { unit: "%", reference: "1 - 6" },
  Monocytes: { unit: "%", reference: "2 - 10" },
  Basophils: { unit: "%", reference: "< 2" },
  "Platelet Count": { unit: "lakhs/cumm", reference: "1.5 - 4.1" },
  "Total RBC Count": { unit: "million/cumm", reference: "4.5 - 5.5" },
  "Hematocrit Value, Hct": { unit: "%", reference: "40 - 50" },
  "Mean Corpuscular Volume, MCV": { unit: "fL", reference: "83 - 101" },
  "Mean Cell Haemoglobin, MCH": { unit: "Pg", reference: "27 - 32" },
  "Mean Cell Haemoglobin CON, MCHC": { unit: "%", reference: "31.5 - 34.5" },
  BUN: { unit: "mg/dl", reference: "7.9 - 20" },
  "Serum Urea": { unit: "mg/dl", reference: "19 - 45" },
  "25 Hydroxy (OH) Vitamin D": { unit: "ng/mL", reference: "30 - 100" },
  "Vitamin D": { unit: "ng/mL", reference: "30 - 100" },
  "Vitamin B12": { unit: "pg/ml", reference: "211 - 911" },
};

function formatForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatForDisplay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRangeForDuration(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const to = new Date(today);
  const from = new Date(today);

  if (value === "7") from.setDate(from.getDate() - 6);
  else if (value === "14") from.setDate(from.getDate() - 13);
  else if (value === "30") from.setDate(from.getDate() - 29);
  else if (value === "today") {
    // keep today
  } else {
    return { from: "", to: "" };
  }

  return { from: formatForInput(from), to: formatForInput(to) };
}

export default function SearchReports() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState({
    regNo: "",
    firstName: "",
    status: "",
    refBy: "",
    test: "",
    from: "",
    to: "",
    duration: "today",
  });

  const [entryCase, setEntryCase] = useState(null);
  const [entryValues, setEntryValues] = useState({});
  const [viewCase, setViewCase] = useState(null);

  // Fetch reports from database
  useEffect(() => {
    let cancelled = false;

    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listReports({ limit: 1000 });
        if (!cancelled) setCases(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load reports");
          console.error("Error loading reports:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReports();

    const { from, to } = getRangeForDuration("today");
    setF((prev) => ({ ...prev, from, to, duration: "today" }));

    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const onDurationChange = (e) => {
    const value = e.target.value;

    if (value === "custom" || value === "all") {
      setF((prev) => ({
        ...prev,
        duration: value,
        from: value === "all" ? "" : prev.from,
        to: value === "all" ? "" : prev.to,
      }));
      return;
    }

    const range = getRangeForDuration(value);
    setF((prev) => ({ ...prev, duration: value, from: range.from, to: range.to }));
  };

  const resetFilters = () => {
    setF({
      regNo: "",
      firstName: "",
      status: "",
      refBy: "",
      test: "",
      from: "",
      to: "",
      duration: "all",
    });
  };

  const renderTests = (tests) => {
    if (!Array.isArray(tests) || tests.length === 0) return "—";
    return tests
      .map((t) => (typeof t === "string" ? t : (t && t.name) || ""))
      .filter(Boolean)
      .join(", ");
  };

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (f.regNo && !String(c.regNo || "").includes(f.regNo)) return false;

      if (
        f.firstName &&
        !`${c.firstName || ""}`.toLowerCase().includes(f.firstName.toLowerCase())
      )
        return false;

      if (f.refBy && !`${c.refBy || ""}`.toLowerCase().includes(f.refBy.toLowerCase()))
        return false;

      if (f.status && c.status !== f.status) return false;

      if (f.test) {
        const testStr = Array.isArray(c.tests)
          ? c.tests
              .map((t) => (typeof t === "string" ? t : (t && t.name) || ""))
              .join(" ")
          : "";
        if (!testStr.toLowerCase().includes(f.test.toLowerCase())) return false;
      }

      const caseDateStr = c.dt ? String(c.dt).slice(0, 10) : "";
      if (f.from && caseDateStr < f.from) return false;
      if (f.to && caseDateStr > f.to) return false;

      return true;
    });
  }, [cases, f]);

  const dispDate = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleString("en-IN");
  };

  const openEntry = (caseObj) => {
    setEntryCase(caseObj || null);

    const initial = {};
    if (caseObj && Array.isArray(caseObj.tests)) {
      caseObj.tests.forEach((t) => {
        const name = typeof t === "string" ? t : (t && t.name) || "";
        if (!name) return;
        const prev = caseObj.results && caseObj.results[name] ? caseObj.results[name] : "";
        initial[name] = prev;
      });
    }
    setEntryValues(initial);
  };

  const closeEntry = () => {
    setEntryCase(null);
    setEntryValues({});
  };

  const onValueChange = (testName, value) => {
    setEntryValues((prev) => ({ ...prev, [testName]: value }));
  };

  const saveEntry = async () => {
    if (!entryCase || !entryCase._id) return;
    if (entryCase._saving) return;

    const updatedCase = { ...entryCase, _saving: true };
    setEntryCase(updatedCase);

    try {
      const resultsObj = {};
      Object.entries(entryValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          resultsObj[key] = String(value);
        }
      });

      const updated = await updateReport(entryCase._id, { results: resultsObj });

      const nextCases = cases.map((c) => (c._id === entryCase._id ? updated : c));
      setCases(nextCases);

      closeEntry();
    } catch (err) {
      console.error("Error saving results", err);
      alert(err?.message || "Failed to save results. Please try again.");
      setEntryCase(entryCase);
    }
  };

  const openView = (caseObj) => setViewCase(caseObj || null);
  const closeView = () => setViewCase(null);

  return (
    <>
      <div className="w-full bg-white">
        <div className="px-6 py-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-lg text-gray-800">Name</label>
              <input
                name="firstName"
                value={f.firstName}
                onChange={onChange}
                className="w-full border rounded-md px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-lg text-gray-800">Reg. no.</label>
              <input
                name="regNo"
                value={f.regNo}
                onChange={onChange}
                className="w-full border rounded-md px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-lg text-gray-800">Referred by</label>
              <input
                name="refBy"
                value={f.refBy}
                onChange={onChange}
                className="w-full border rounded-md px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-lg text-gray-800">Test name</label>
              <input
                name="test"
                value={f.test}
                onChange={onChange}
                className="w-full border rounded-md px-3 py-2 text-base"
                placeholder="CBC, Vitamin D, etc"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-lg text-gray-800">Duration</label>
              <div className="flex border rounded-md overflow-hidden bg-white text-base">
                <select
                  name="duration"
                  value={f.duration}
                  onChange={onDurationChange}
                  className="px-3 py-2 outline-none border-r bg-white"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7">Past 7 days</option>
                  <option value="14">Past 14 days</option>
                  <option value="30">Past 30 days</option>
                  <option value="custom">Custom dates</option>
                </select>
                <div className="flex-1 px-3 py-2 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {f.from && f.to ? `${formatForDisplay(f.from)} to ${formatForDisplay(f.to)}` : "All dates"}
                </div>
              </div>
            </div>
          </div>

          {f.duration === "custom" && (
            <div className="flex gap-3 mt-4">
              <input
                type="date"
                name="from"
                value={f.from}
                onChange={onChange}
                className="border rounded-md px-3 py-2 text-base"
              />
              <span className="text-gray-600 text-base mt-2">to</span>
              <input
                type="date"
                name="to"
                value={f.to}
                onChange={onChange}
                className="border rounded-md px-3 py-2 text-base"
              />
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-base hover:bg-blue-700">
              Search
            </button>
            <button
              onClick={resetFilters}
              className="border px-4 py-2 rounded-md text-base hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {loading ? (
              <span>Loading reports...</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <>Total cases loaded: {cases.length}, Showing: {filtered.length}</>
            )}
          </div>

          {/* ✅ RESULTS TABLE WRAPPER (same as TestPanels) */}
          <div className="mt-4 bg-white border rounded-xl overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading reports...</div>
            ) : error ? (
              <div className="py-10 text-center text-red-600">{error}</div>
            ) : cases.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No reports available. Please add cases from "Today&apos;s report".
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No reports found for given filters.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1100px] table-fixed">
                {/* ✅ col widths to keep heading spacing like TestPanels */}
                <colgroup><col style={{ width: "8rem" }} /><col style={{ width: "12rem" }} /><col style={{ width: "12rem" }} /><col style={{ width: "10rem" }} /><col /><col style={{ width: "8rem" }} /><col style={{ width: "11rem" }} /></colgroup>

                {/* ✅ HEADER EXACTLY LIKE TestPanels (bg-green-50 + uppercase + font size) */}
                <thead className="bg-green-50 text-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase">REG. NO.</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">DATE / TIME</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">PATIENT</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">REFERRED BY</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">TESTS</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">STATUS</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-right">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody className="text-gray-900">
                  {filtered.map((c) => (
                    <tr key={c._id || c.regNo} className="border-t hover:bg-slate-50 align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">#{c.regNo || "—"}</td>
                      <td className="px-4 py-3">{dispDate(c.dt)}</td>
                      <td className="px-4 py-3 truncate">
                        {(c.firstName || "") + " " + (c.lastName || "")}
                      </td>
                      <td className="px-4 py-3 truncate">{c.refBy || "—"}</td>
                      <td className="px-4 py-3 truncate">{renderTests(c.tests)}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col gap-1 text-blue-600 text-sm font-medium">
                          <button
                            className="inline-flex items-center justify-end gap-1 hover:underline"
                            onClick={() => openEntry(c)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            <span>Enter results</span>
                          </button>

                          <button
                            className="inline-flex items-center justify-end gap-1 hover:underline"
                            onClick={() => openView(c)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>View</span>
                            <span className="ml-1 text-base leading-none">…</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ENTRY MODAL */}
      {entryCase && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="px-6 py-6 w-full max-w-5xl mx-auto">
            <h1 className="text-[32px] font-bold text-gray-900">Lab report</h1>
            <div className="mt-2 mb-6 h-[2px] bg-gray-200" />
            <div className="border rounded-md bg-white">
              <div className="px-4 pt-4 pb-3 border-b">
                <h2 className="text-[18px] font-semibold text-center text-gray-900">
                  Patient Information
                </h2>
                <div className="mt-1 mb-3 h-[2px] w-32 mx-auto bg-gray-500" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[14px] text-gray-900">
                  <div className="flex justify-between">
                    <span className="font-semibold">Sample ID:</span>
                    <span>{entryCase.sampleId || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Patient Name:</span>
                    <span>
                      {(entryCase.firstName || "") + " " + (entryCase.lastName || "")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Age / Sex:</span>
                    <span>
                      {(entryCase.age || "—") + (entryCase.gender ? ` / ${entryCase.gender}` : "")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Mobile number:</span>
                    <span>{entryCase.mobile || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Reg. no:</span>
                    <span>#{entryCase.regNo || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Status:</span>
                    <span className="capitalize">{entryCase.status || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Sample collection date &amp; time:</span>
                    <span>{dispDate(entryCase.dt)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Referred By:</span>
                    <span>{entryCase.refBy || "Self"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Collected By:</span>
                    <span>{entryCase.collectedBy || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Sample Type:</span>
                    <span>{entryCase.sampleType || "—"}</span>
                  </div>

                  <div className="flex justify-between md:col-span-2">
                    <span className="font-semibold">Address:</span>
                    <span className="text-right">{entryCase.address || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-4 pb-5">
                <h2 className="text-[18px] font-semibold mb-4 mx-auto inline-block border-b border-gray-400 pb-1 text-center">
                  Tests &amp; results
                </h2>

                <div className="rounded-md overflow-hidden border border-gray-100">
                  {!Array.isArray(entryCase.tests) || entryCase.tests.length === 0 ? (
                    <div className="py-6 text-center text-gray-500 text-sm">
                      No tests added for this case.
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs md:text-sm border-collapse">
                      <thead className="bg-gray-50 border-b">
                        <tr className="text-left text-gray-700">
                          <th className="px-4 py-2 w-[260px]">TEST</th>
                          <th className="px-4 py-2 w-[160px]">VALUE</th>
                          <th className="px-4 py-2 w-[120px]">UNIT</th>
                          <th className="px-4 py-2">REFERENCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entryCase.tests.map((t, idx) => {
                          const name = typeof t === "string" ? t : (t && t.name) || "";
                          const short = typeof t === "string" ? "" : t.shortName || "";
                          const key = name || `test-${idx}`;

                          const fromObj =
                            typeof t === "object" && t
                              ? {
                                  unit: t.unit || t.reportUnit || t.unitName || "",
                                  reference:
                                    t.reference || t.referenceRange || t.normalRange || "",
                                }
                              : { unit: "", reference: "" };

                          const fromMap = TEST_META[name] || (short ? TEST_META[short] : null) || {};

                          const unit = fromObj.unit || fromMap.unit || "—";
                          const reference = fromObj.reference || fromMap.reference || "—";

                          return (
                            <tr key={key} className="border-t even:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900 align-middle">
                                {name || "—"}
                                {short && (
                                  <span className="ml-1 text-gray-500 text-[11px]">({short})</span>
                                )}
                              </td>
                              <td className="px-4 py-2 align-middle">
                                <input
                                  className="w-full border rounded-md px-2 py-1 text-xs md:text-sm"
                                  value={entryValues[name] || ""}
                                  onChange={(e) => onValueChange(name, e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2 text-gray-700 align-middle">{unit}</td>
                              <td className="px-4 py-2 text-gray-700 align-middle">{reference}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={saveEntry}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    Save results
                  </button>
                  <button
                    onClick={closeEntry}
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewCase && (
        <div className="fixed inset-0 z-40 bg-white overflow-auto">
          <div className="px-6 py-6 w-full max-w-5xl mx-auto">
            <h1 className="text-[32px] font-bold text-gray-900">Lab report</h1>
            <div className="mt-2 mb-6 h-[2px] bg-gray-200" />

            <div className="border rounded-md bg-white">
              <div className="px-4 pt-4 pb-3 border-b">
                <h2 className="text-[18px] font-semibold text-center text-gray-900">
                  Patient Information
                </h2>
                <div className="mt-1 mb-3 h-[2px] w-32 mx-auto bg-gray-500" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[14px] text-gray-900">
                  <div className="flex justify-between">
                    <span className="font-semibold">Sample ID:</span>
                    <span>{viewCase.sampleId || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Patient Name:</span>
                    <span>{(viewCase.firstName || "") + " " + (viewCase.lastName || "")}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Age / Sex:</span>
                    <span>
                      {(viewCase.age || "—") + (viewCase.gender ? ` / ${viewCase.gender}` : "")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Mobile number:</span>
                    <span>{viewCase.mobile || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Reg. no:</span>
                    <span>#{viewCase.regNo || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Status:</span>
                    <span className="capitalize">{viewCase.status || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Sample collection date &amp; time:</span>
                    <span>{dispDate(viewCase.dt)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Referred By:</span>
                    <span>{viewCase.refBy || "Self"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Collected By:</span>
                    <span>{viewCase.collectedBy || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Sample Type:</span>
                    <span>{viewCase.sampleType || "—"}</span>
                  </div>

                  <div className="flex justify-between md:col-span-2">
                    <span className="font-semibold">Address:</span>
                    <span className="text-right">{viewCase.address || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-4 pb-5">
                <h2 className="text-[18px] font-semibold mb-4 mx-auto inline-block border-b border-gray-400 pb-1 text-center">
                  Tests &amp; results
                </h2>

                <div className="rounded-md overflow-hidden border border-gray-100">
                  {!Array.isArray(viewCase.tests) || viewCase.tests.length === 0 ? (
                    <div className="py-6 text-center text-gray-500 text-sm">
                      No tests added for this case.
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs md:text-sm border-collapse">
                      <thead className="bg-gray-50 border-b">
                        <tr className="text-left text-gray-700">
                          <th className="px-4 py-2 w-[260px]">TEST</th>
                          <th className="px-4 py-2 w-[160px]">VALUE</th>
                          <th className="px-4 py-2 w-[120px]">UNIT</th>
                          <th className="px-4 py-2">REFERENCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewCase.tests.map((t, idx) => {
                          const name = typeof t === "string" ? t : (t && t.name) || "";
                          const short = typeof t === "string" ? "" : t.shortName || "";
                          const key = name || `test-${idx}`;

                          const fromObj =
                            typeof t === "object" && t
                              ? {
                                  unit: t.unit || t.reportUnit || t.unitName || "",
                                  reference:
                                    t.reference || t.referenceRange || t.normalRange || "",
                                }
                              : { unit: "", reference: "" };

                          const fromMap = TEST_META[name] || (short ? TEST_META[short] : null) || {};

                          const unit = fromObj.unit || fromMap.unit || "—";
                          const reference = fromObj.reference || fromMap.reference || "—";

                          const value = (viewCase.results && viewCase.results[name]) || "—";

                          return (
                            <tr key={key} className="border-t even:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900 align-middle">
                                {name || "—"}
                                {short && (
                                  <span className="ml-1 text-gray-500 text-[11px]">({short})</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-900 align-middle">{value}</td>
                              <td className="px-4 py-2 text-gray-700 align-middle">{unit}</td>
                              <td className="px-4 py-2 text-gray-700 align-middle">{reference}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={closeView}
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

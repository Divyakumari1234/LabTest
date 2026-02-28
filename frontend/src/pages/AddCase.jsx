
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listLabTests, createReport } from "../services/api";

const pad = (n) => String(n).padStart(2, "0");

const toLocalDateTime = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${DD}T${hh}:${mm}`;
};

const makeRegNo = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
};

export default function AddCase() {
  const navigate = useNavigate();

  const makeEmptyForm = useCallback(
    () => ({
      sampleId: "",
      firstName: "",
      lastName: "",
      age: "",
      gender: "",
      mobile: "",
      refBy: "",
      regNo: makeRegNo(),
      dt: toLocalDateTime(),
      sampleType: "",
      address: "",
    }),
    []
  );

  const [form, setForm] = useState({
    sampleId: "",
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    mobile: "",
    refBy: "",
    regNo: makeRegNo(),
    dt: toLocalDateTime(),
    sampleType: "",
    address: "",
  });

  const [tests, setTests] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  const [allTests, setAllTests] = useState([]);
  const [testSearch, setTestSearch] = useState("");
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsError, setTestsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchTests = useCallback(async () => {
    setLoadingTests(true);
    setTestsError("");
    try {
      const res = await listLabTests({
        page: 1,
        limit: 5000,
        sort: "order",
        fields: "order,name,shortName,category",
      });
      const items = Array.isArray(res?.items) ? res.items : [];
      setAllTests(items);
    } catch (err) {
      setTestsError(err?.message || "Failed to load tests");
    } finally {
      setLoadingTests(false);
    }
  }, []);

  useEffect(() => {
    if (showSelector && !loadingTests) {
      fetchTests();
    }
  }, [showSelector, fetchTests]);

  useEffect(() => {
    const handleTestChange = () => {
      if (showSelector) {
        fetchTests();
      }
    };

    window.addEventListener("labtests:changed", handleTestChange);
    return () => {
      window.removeEventListener("labtests:changed", handleTestChange);
    };
  }, [showSelector, fetchTests]);

  const removeTest = (name) =>
    setTests((prev) => prev.filter((t) => t.name !== name));

  const addTest = (t) =>
    setTests((prev) => {
      if (prev.some((x) => x.name === t.name)) return prev;
      return [
        ...prev,
        {
          name: t.name,
          shortName: t.shortName || "",
        },
      ];
    });

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (value.length > 10) return;
      if (!/^[0-9]*$/.test(value)) return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const filteredTests = useMemo(() => {
    if (!testSearch.trim()) return allTests;
    const q = testSearch.toLowerCase();
    return allTests.filter((t) => {
      const n = (t.name || "").toLowerCase();
      const s = (t.shortName || "").toLowerCase();
      const c = (t.category || "").toLowerCase();
      return n.includes(q) || s.includes(q) || c.includes(q);
    });
  }, [allTests, testSearch]);

  const validateForm = () => {
    if (!form.sampleId) return "Sample ID is required";
    if (!form.firstName) return "First name is required";
    if (!form.lastName) return "Last name is required";
    if (!form.age) return "Age is required";
    if (!form.gender) return "Gender is required";
    if (!form.mobile) return "Mobile number is required";
    if (form.mobile.length !== 10)
      return "Mobile number must be exactly 10 digits";
    if (!form.refBy) return "Referred by is required";
    if (!form.dt) return "Sample collection date & time is required";
    if (!form.sampleType) return "Sample type is required";
    if (!form.address) return "Address is required";
    return null;
  };

  const saveCase = async () => {
    if (saving) return;

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const payload = {
        ...form,
        collectedBy: "N/A",
        status: "new",
        dt: form.dt || new Date().toISOString(),
        tests: tests.map((t) => ({
          name: t.name,
          shortName: t.shortName || "",
        })),
        results: {},
      };

      await createReport(payload);

      // ✅ success popup
      alert("Successfully submitted ✅");

      // reset form and selections after save
      setForm(makeEmptyForm());
      setTests([]);
      setShowSelector(false);
      setTestSearch("");
      setSaveError("");

      // keep same behavior
      navigate("/lab/reports");
    } catch (error) {
      setSaveError(error?.message || "Failed to save report. Please try again.");
      alert(error?.message || "Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5 text-[17px]">
          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Sample ID
            </label>
            <input
              name="sampleId"
              value={form.sampleId}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              First name
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Last name
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:col-span-3">
            <div>
              <label className="block text-[16px] font-semibold text-gray-800 mb-1">
                Age
              </label>
              <input
                name="age"
                value={form.age}
                onChange={onChange}
                required
                className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[16px] font-semibold text-gray-800 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={onChange}
                required
                className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[16px] font-semibold text-gray-800 mb-1">
                Mobile number
              </label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={onChange}
                required
                maxLength={10}
                className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Referred by
            </label>
            <input
              name="refBy"
              value={form.refBy}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Reg. no
            </label>
            <input
              name="regNo"
              value={form.regNo}
              readOnly
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-semibold text-gray-900 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Sample collection date &amp; time
            </label>
            <input
              type="datetime-local"
              name="dt"
              value={form.dt}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Sample Type
            </label>
            <select
              name="sampleType"
              value={form.sampleType}
              onChange={onChange}
              required
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900"
            >
              <option value=""></option>
              <option value="AAA">AAA</option>
              <option value="BBB">BBB</option>
              <option value="CCC">CCC</option>
              <option value="DDD">DDD</option>
            </select>
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-gray-800 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={onChange}
              required
              rows={2}
              className="w-full border rounded-md px-3 py-2.5 text-[16px] font-medium text-gray-900 resize-y"
            />
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white">
            <div>
              <h2 className="text-[20px] font-semibold text-gray-900">Tests</h2>
              <p className="text-[14px] text-gray-600 font-normal">
                Select one or more lab tests to be performed for this case.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSelector((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-sky-500 px-3 py-1.5 text-[14px] font-semibold text-sky-700 hover:bg-sky-50"
            >
              <span className="text-base leading-none">＋</span>
              <span>{showSelector ? "Hide test list" : "Select tests"}</span>
            </button>
          </div>

          {tests.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tests.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-800 px-3 py-1 text-[14px] font-medium"
                >
                  {t.name}
                  {t.shortName ? ` (${t.shortName})` : ""}
                  <button
                    type="button"
                    onClick={() => removeTest(t.name)}
                    className="text-xs text-blue-800 hover:text-blue-900 font-semibold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {showSelector && (
            <div className="border rounded-lg p-4 bg-gray-50 mt-2">
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Search in test database (name / short name / category)"
                  className="flex-1 border rounded-md px-3 py-2 text-[16px] font-medium text-gray-900"
                />
                <button
                  type="button"
                  onClick={fetchTests}
                  disabled={loadingTests}
                  className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh tests from database"
                >
                  🔄 Refresh
                </button>
              </div>

              {allTests.length > 0 && (
                <div className="mb-2 text-xs text-gray-600">
                  Showing {filteredTests.length} of {allTests.length} tests from
                  database
                </div>
              )}

              {loadingTests && (
                <div className="px-3 py-2 text-gray-700 text-[14px] font-medium">
                  Loading tests…
                </div>
              )}
              {testsError && !loadingTests && (
                <div className="px-3 py-2 text-red-600 text-[14px] font-medium">
                  {testsError}
                </div>
              )}

              {!loadingTests && !testsError && (
              <div className="max-h-64 overflow-auto bg-white border rounded-md">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] text-[14px]">
                    <thead className="bg-gray-100">
                      <tr className="text-left text-gray-800 font-semibold">
                        <th className="px-3 py-2 w-16">#</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2 w-40">Short name</th>
                        <th className="px-3 py-2 w-40">Category</th>
                        <th className="px-3 py-2 w-24">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-3 text-center text-gray-600 font-medium"
                          >
                            No matching tests.
                          </td>
                        </tr>
                      ) : (
                        filteredTests.map((t) => {
                          const already = tests.some((x) => x.name === t.name);
                          return (
                            <tr
                              key={t._id || `${t.name}-${t.order}`}
                              className="border-t hover:bg-gray-50"
                            >
                              <td className="px-3 py-2 text-gray-800 font-medium">
                                {t.order ?? "—"}.
                              </td>
                              <td className="px-3 py-2 text-gray-900 font-semibold">
                                {t.name}
                              </td>
                              <td className="px-3 py-2 text-gray-800">
                                {t.shortName || "—"}
                              </td>
                              <td className="px-3 py-2 text-gray-800">
                                {t.category || "—"}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => addTest(t)}
                                  disabled={already}
                                  className={`text-xs font-semibold ${
                                    already
                                      ? "text-gray-400 cursor-default"
                                      : "text-blue-600 hover:text-blue-800"
                                  }`}
                                >
                                  {already ? "Added" : "Add"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 pb-10">
          <button
            onClick={saveCase}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-white text-[15px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save case"}
          </button>
          <button
            onClick={() => navigate("/lab/reports")}
            className="rounded-md border px-4 py-2 text-[15px] font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

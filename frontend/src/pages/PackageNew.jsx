import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPackage, getPackage, updatePackage } from "../services/api";
import { PROFILES } from "../data/profilesData";
import { HEADS } from "../data/headData";
import { TESTS } from "../data/testData";

const GENDERS = ["Both", "Male", "Female"];
const DRAFT_KEY_NEW = "pkg_new_draft_v1";
const DRAFT_KEY_EDIT = (id) => `pkg_edit_draft_v1_${id}`;


function TestsMultiSelect({ value = [], onChange, options = [] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const selected = Array.isArray(value) ? value : [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = Array.isArray(options) ? options : [];
    if (!term) return all.slice(0, 80);
    return all
      .filter((t) => String(t).toLowerCase().includes(term))
      .slice(0, 80);
  }, [q, options]);

  const add = (t) => {
    if (!t) return;
    if (selected.includes(t)) return;
    onChange([...selected, t]);
    setQ("");
    setOpen(false);
  };

  const remove = (t) => onChange(selected.filter((x) => x !== t));

  return (
    <div className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs"
              title={t}
            >
              <span className="max-w-[180px] sm:max-w-[240px] truncate">{t}</span>
              <button
                type="button"
                onClick={() => remove(t)}
                className="text-blue-700 hover:text-blue-900 font-bold"
                aria-label="Remove test"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Type to search tests..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No test found.</div>
          ) : (
            filtered.map((t) => (
              <button
                type="button"
                key={t}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(t)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  selected.includes(t)
                    ? "bg-gray-50 text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {t}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Browser({
  items,
  selectedName,
  setSelectedName,
  openName,
  setOpenName,
  getSelectedFor,
  toggleItem,
  toggleAll,
}) {
  const [q, setQ] = useState("");
  const [opened, setOpened] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((p) =>
      String(p?.name || "").toLowerCase().includes(term)
    );
  }, [q, items]);

  const onPick = (name) => {
    setSelectedName(name);
    setOpenName((cur) => (cur === name ? "" : name));
  };

  return (
    <div className="border rounded-md bg-white overflow-hidden">
      <div className="p-2 border-b bg-gray-50">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpened(true)}
          className="w-full border rounded px-3 py-2"
          placeholder="Click to select package"
        />

        {opened && (
          <div className="text-xs text-gray-500 mt-1">
            Selected:{" "}
            <span className="font-semibold">{selectedName || "—"}</span>
          </div>
        )}
      </div>

      {opened && (
        <div className="max-h-72 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No package found.</div>
          ) : (
            filtered.map((p, idx) => {
              const name = String(p?.name || "");
              const tests = Array.isArray(p?.tests) ? p.tests : [];
              const isOpen = openName === name;

              const selectedArr = getSelectedFor(name);
              const selectedCount = tests.filter((t) => selectedArr.includes(t))
                .length;
              const allSelected =
                tests.length > 0 && selectedCount === tests.length;

              return (
                <div key={`${name}__${idx}`} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onPick(name)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 min-w-0
                      ${selectedName === name ? "bg-blue-50" : "bg-white"}`}
                  >
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 py-2 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => toggleAll(name, tests)}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          {allSelected ? "Unselect all" : "Select all"}
                        </button>
                        <span className="text-xs text-gray-500">
                          {selectedCount}/{tests.length}
                        </span>
                      </div>

                      <div className="max-h-44 overflow-auto pr-1">
                        {tests.map((t) => (
                          <label
                            key={t}
                            className="flex items-start gap-2 py-1 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedArr.includes(t)}
                              onChange={() => toggleItem(name, t)}
                            />
                            <span className="text-gray-800">{t}</span>
                          </label>
                        ))}

                        {!tests.length && (
                          <div className="text-xs text-gray-500">
                            No tests inside this package.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function PackageNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editingId = params.get("id");

  const [form, setForm] = useState({
    name: "",
    fee: "",
    gender: "Both",
    profile: "",
    profileSelections: {},
    tests: [],
    head: "",
    headSelections: {},
    panels: [],
  });

  const [openProfileName, setOpenProfileName] = useState("");
  const [openHeadName, setOpenHeadName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editingId);
  const [error, setError] = useState("");

  const testOptions = useMemo(() => {
    return (Array.isArray(TESTS) ? TESTS : [])
      .map((x) => String(x?.testName || "").trim())
      .filter(Boolean);
  }, []);

  const draftKey = useMemo(
    () => (editingId ? DRAFT_KEY_EDIT(editingId) : DRAFT_KEY_NEW),
    [editingId]
  );

  const saveDraft = useCallback(
    (data) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch {}
    },
    [draftKey]
  );

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
  }, [draftKey]);

  
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setError("");

        if (editingId) {
          setLoading(true);
          const res = await getPackage(editingId);

          const initialProfileSelections =
            res?.profile && Array.isArray(res?.tests)
              ? { [res.profile]: res.tests }
              : {};

          const next = {
            name: res?.name || "",
            fee: res?.fee || "",
            gender: res?.gender || "Both",

            profile: res?.profile || "",
            profileSelections: initialProfileSelections,

            tests: Array.isArray(res?.tests) ? res.tests : [],

            head: res?.head || "",
            headSelections: res?.headSelections || {},

            panels: Array.isArray(res?.panels) ? res.panels : [],
          };

          if (mounted) {
            setForm(next);
            if (next.profile) setOpenProfileName(next.profile);
            if (next.head) setOpenHeadName(next.head);
          }
        }

        const draft = loadDraft();
        if (draft && mounted) {
          setForm((prev) => ({ ...prev, ...draft }));
          if (draft?.profile) setOpenProfileName(draft.profile);
          if (draft?.head) setOpenHeadName(draft.head);
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load package");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [editingId, loadDraft]);

  
  useEffect(() => {
    saveDraft(form);
  }, [form, saveDraft]);

  const preview = useMemo(
    () => ({ ...form, fee: Number(form.fee || 0) }),
    [form]
  );

  
  const getSelectedForProfile = (name) => {
    const arr = form.profileSelections?.[name];
    return Array.isArray(arr) ? arr : [];
  };

  const toggleTestForProfile = (name, test) => {
    setForm((f) => {
      const current = Array.isArray(f.profileSelections?.[name])
        ? f.profileSelections[name]
        : [];
      const exists = current.includes(test);
      const nextArr = exists
        ? current.filter((t) => t !== test)
        : [...current, test];

      const nextMap = { ...(f.profileSelections || {}) };
      if (nextArr.length === 0) delete nextMap[name];
      else nextMap[name] = nextArr;

      return { ...f, profileSelections: nextMap };
    });
  };

  const toggleAllForProfile = (name, allTests) => {
    setForm((f) => {
      const all = Array.isArray(allTests) ? allTests : [];
      const current = Array.isArray(f.profileSelections?.[name])
        ? f.profileSelections[name]
        : [];
      const selectedCount = all.filter((t) => current.includes(t)).length;
      const allSelected = all.length > 0 && selectedCount === all.length;

      const nextMap = { ...(f.profileSelections || {}) };
      if (allSelected) delete nextMap[name];
      else nextMap[name] = all.slice();

      return { ...f, profileSelections: nextMap };
    });
  };

  
  const getSelectedForHead = (name) => {
    const arr = form.headSelections?.[name];
    return Array.isArray(arr) ? arr : [];
  };

  const toggleTestForHead = (name, test) => {
    setForm((f) => {
      const current = Array.isArray(f.headSelections?.[name])
        ? f.headSelections[name]
        : [];
      const exists = current.includes(test);
      const nextArr = exists
        ? current.filter((t) => t !== test)
        : [...current, test];

      const nextMap = { ...(f.headSelections || {}) };
      if (nextArr.length === 0) delete nextMap[name];
      else nextMap[name] = nextArr;

      return { ...f, headSelections: nextMap };
    });
  };

  const toggleAllForHead = (name, allTests) => {
    setForm((f) => {
      const all = Array.isArray(allTests) ? allTests : [];
      const current = Array.isArray(f.headSelections?.[name])
        ? f.headSelections[name]
        : [];
      const selectedCount = all.filter((t) => current.includes(t)).length;
      const allSelected = all.length > 0 && selectedCount === all.length;

      const nextMap = { ...(f.headSelections || {}) };
      if (allSelected) delete nextMap[name];
      else nextMap[name] = all.slice();

      return { ...f, headSelections: nextMap };
    });
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name) return setError("Package name is required");

    const allProfileSelectedTests = Array.from(
      new Set(
        Object.values(form.profileSelections || {}).flatMap((arr) =>
          Array.isArray(arr) ? arr : []
        )
      )
    );

    const manualTests = Array.isArray(form.tests) ? form.tests : [];
    const finalTests = Array.from(
      new Set([...allProfileSelectedTests, ...manualTests])
    );

    const allHeadSelectedTests = Array.from(
      new Set(
        Object.values(form.headSelections || {}).flatMap((arr) =>
          Array.isArray(arr) ? arr : []
        )
      )
    );

    const payload = {
      name: form.name,
      fee: Number(form.fee || 0),
      gender: form.gender,

      profile: form.profile,
      tests: finalTests,

      head: form.head,
      headTests: allHeadSelectedTests,
      headSelections: form.headSelections,

      panels: form.panels,
    };

    try {
      setSaving(true);
      if (editingId) await updatePackage(editingId, payload);
      else await createPackage(payload);

      clearDraft();
      window.dispatchEvent(new Event("packages:changed"));
      navigate("/lab/packages");
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const selectedProfilePackages = Object.entries(
    preview.profileSelections || {}
  ).filter(([, arr]) => Array.isArray(arr) && arr.length > 0);

  const selectedHeadPackages = Object.entries(
    preview.headSelections || {}
  ).filter(([, arr]) => Array.isArray(arr) && arr.length > 0);

  return (
    <div className="w-full pb-8 max-w-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT */}
        <div className="min-w-0">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          
          <form id="pkgForm" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Package Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-medium">Fee (₹)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-lg font-bold text-gray-900 underline">
                Profile & Test Selection
              </div>
            </div>

            <div className="grid grid-cols-1">
              <label className="font-medium mb-1">Profile</label>
              <Browser
                items={Array.isArray(PROFILES) ? PROFILES : []}
                selectedName={form.profile}
                setSelectedName={(name) => setForm((f) => ({ ...f, profile: name }))}
                openName={openProfileName}
                setOpenName={setOpenProfileName}
                getSelectedFor={getSelectedForProfile}
                toggleItem={toggleTestForProfile}
                toggleAll={toggleAllForProfile}
              />
            </div>

            <div className="grid grid-cols-1">
              <label className="font-medium mb-1">Tests</label>
              <TestsMultiSelect
                options={testOptions}
                value={form.tests}
                onChange={(v) => setForm((f) => ({ ...f, tests: v }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-medium">Head</label>
                <Browser
                  items={Array.isArray(HEADS) ? HEADS : []}
                  selectedName={form.head}
                  setSelectedName={(name) => setForm((f) => ({ ...f, head: name }))}
                  openName={openHeadName}
                  setOpenName={setOpenHeadName}
                  getSelectedFor={getSelectedForHead}
                  toggleItem={toggleTestForHead}
                  toggleAll={toggleAllForHead}
                />
              </div>
            </div>

           
          </form>
        </div>

       
        <div className="min-w-0 bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6 lg:mt-0 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Live Preview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Name</span>
              <div>{preview.name || "—"}</div>
            </div>
            <div>
              <span className="font-semibold">Fee</span>
              <div>₹{preview.fee}</div>
            </div>
            <div>
              <span className="font-semibold">Gender</span>
              <div>{preview.gender}</div>
            </div>
          </div>

          
          <div className="mt-6">
            <div className="text-sm font-bold text-blue-900 mb-2">Profile</div>

            {selectedProfilePackages.length === 0 ? (
              <div className="text-sm text-gray-600">No package selected.</div>
            ) : (
              <div className="space-y-4">
                {selectedProfilePackages.map(([pkgName, tests]) => (
                  <div key={pkgName} className="rounded-md border border-blue-200 bg-white">
                    <div className="px-3 py-2 border-b border-blue-100 font-semibold text-sm">
                      {pkgName}
                    </div>
                    <div className="px-3 py-2 text-xs text-gray-600">
                      Selected Tests: {tests.length}
                    </div>
                    <div className="px-3 pb-3 max-h-64 overflow-auto text-sm">
                      {tests.map((t) => (
                        <div key={t} className="truncate" title={t}>
                          • {t}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="mt-6">
            <div className="text-sm font-bold text-blue-900 mb-2">Tests</div>

            {Array.isArray(preview.tests) && preview.tests.length ? (
              <div className="rounded-md border border-blue-200 bg-white">
                <div className="px-3 py-2 text-xs text-gray-600">
                  Selected: {preview.tests.length}
                </div>
                <div className="px-3 pb-3 max-h-64 overflow-auto text-sm">
                  {preview.tests.map((t) => (
                    <div key={t} className="truncate" title={t}>
                      • {t}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No test selected.</div>
            )}
          </div>

          
          <div className="mt-6">
            <div className="text-sm font-bold text-blue-900 mb-2">Head</div>

            {selectedHeadPackages.length === 0 ? (
              <div className="text-sm text-gray-600">No head selected.</div>
            ) : (
              <div className="space-y-4">
                {selectedHeadPackages.map(([pkgName, tests]) => (
                  <div key={pkgName} className="rounded-md border border-blue-200 bg-white">
                    <div className="px-3 py-2 border-b border-blue-100 font-semibold text-sm">
                      {pkgName}
                    </div>
                    <div className="px-3 py-2 text-xs text-gray-600">
                      Selected Tests: {tests.length}
                    </div>
                    <div className="px-3 pb-3 max-h-64 overflow-auto text-sm">
                      {tests.map((t) => (
                        <div key={t} className="truncate" title={t}>
                          • {t}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="submit"
              form="pkgForm"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold w-full sm:w-auto"
            >
              {saving ? "Saving…" : "Save"}
            </button>

            <button
              type="button"
              onClick={() => {
                clearDraft();
                navigate("/lab/packages");
              }}
              className="border px-6 py-2 rounded w-full sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

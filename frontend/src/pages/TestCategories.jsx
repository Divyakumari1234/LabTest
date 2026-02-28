// src/pages/TestCategories.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const INITIAL_CATEGORIES = [
  { order: 1, name: "Haematology" },
  { order: 2, name: "Biochemistry" },
  { order: 3, name: "Serology & Immunology" },
  { order: 4, name: "Clinical Pathology" },
  { order: 5, name: "Cytology" },
  { order: 6, name: "Microbiology" },
  { order: 7, name: "Endocrinology" },
  { order: 8, name: "Histopathology" },
  { order: 9, name: "Others" },
  { order: 10, name: "Miscellaneous" },
];

export default function TestCategories() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState(INITIAL_CATEGORIES);
  const [mode, setMode] = useState("list");
  const [editingRow, setEditingRow] = useState(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlMode = params.get("mode");

    if (urlMode === "new") {
      setMode("new");
      setEditingRow(null);
      setEditName("");
    } else {
      setMode((prev) => (prev === "edit" ? prev : "list"));
    }
  }, [location.search]);

  const goBackToList = () => {
    setMode("list");
    setEditingRow(null);
    setEditName("");
    setNewName("");
    navigate("/lab/categories");
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditName(row.name);
    setMode("edit");
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert("Please enter category name");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.order === editingRow.order ? { ...r, name: editName.trim() } : r
      )
    );
    goBackToList();
  };

  const handleSaveNew = () => {
    if (!newName.trim()) {
      alert("Please enter category name");
      return;
    }
    setRows((prev) => {
      const maxOrder = prev.reduce((max, r) => (r.order > max ? r.order : max), 0);
      return [
        ...prev,
        { order: maxOrder + 1, name: newName.trim() },
      ];
    });
    goBackToList();
  };

  if (mode === "new") {
    return (
      <div className="w-full">
        <div className="max-w-4xl">
          <div className="text-xs font-medium text-gray-500 mb-4">
            <button
              onClick={goBackToList}
              className="uppercase tracking-wide hover:underline"
            >
              ALL CATEGORIES
            </button>
            <span className="mx-2">/</span>
            <span className="uppercase tracking-wide text-gray-700">ADD NEW</span>
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            New category
          </h2>

          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-800">
                * Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded-md px-3 py-2.5 text-base text-gray-900"
              />
            </div>

            <button
              onClick={handleSaveNew}
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "edit" && editingRow) {
    return (
      <div className="w-full">
        <div className="max-w-4xl">
          <div className="text-xs font-medium text-gray-500 mb-4">
            <button
              onClick={goBackToList}
              className="uppercase tracking-wide hover:underline"
            >
              ALL CATEGORIES
            </button>
            <span className="mx-2">/</span>
            <span className="uppercase tracking-wide text-gray-700">EDIT</span>
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Edit category
          </h2>

          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-800">
                * Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border rounded-md px-3 py-2.5 text-base text-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-gray-400 text-[10px]">
                i
              </span>
              <span>Originally: {editingRow.name}</span>
            </div>

            <button
              onClick={handleSaveEdit}
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ LIST VIEW (Test Panels style)
  return (
    <div className="w-full">
      <div className="bg-white border rounded-xl overflow-x-auto">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px] table-fixed">
          <colgroup><col style={{ width: "8rem" }} /><col /><col style={{ width: "14rem" }} /></colgroup>

          <thead className="bg-green-50 text-gray-700">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold tracking-wide">ORDER</th>
              <th className="px-5 py-3 font-semibold tracking-wide">NAME</th>
              <th className="px-5 py-3 font-semibold tracking-wide text-right">
                ACTION
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-900">
            {rows.map((row) => (
              <tr key={row.order} className="border-t align-top hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">
                  <div className="inline-flex items-center gap-3">
                    <span className="text-gray-900 font-medium">
                      {row.order}.
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3 font-medium">
                  {row.name}
                </td>

                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-5 text-[13px]">
                    <button
                      onClick={() => handleEditClick(row)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      Edit
                    </button>

                    <button
                      onClick={() => navigate("/lab/database")}
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View tests
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

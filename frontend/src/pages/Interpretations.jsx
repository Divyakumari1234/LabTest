import React, { useState } from "react";
import { testInterpretations } from "../data/testInterpretations"; // named export

export default function Interpretations() {
  const [tests, setTests] = useState(() =>
    testInterpretations.map((t, index) => ({
      ...t,
      _id: t.id ?? t.sNo ?? t.serialNo ?? index,
      interpretation: t.interpretation || "",
    }))
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [interpretationText, setInterpretationText] = useState("");
  const [modalMode, setModalMode] = useState("add");

  const openModal = (test, mode) => {
    setSelectedTest(test);
    setModalMode(mode);
    setInterpretationText(test.interpretation || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
    setInterpretationText("");
  };

  const handleSave = () => {
    if (!selectedTest) return;

    const updated = tests.map((t) =>
      t._id === selectedTest._id ? { ...t, interpretation: interpretationText } : t
    );

    setTests(updated);
    setSelectedTest((prev) =>
      prev ? { ...prev, interpretation: interpretationText } : prev
    );
    closeModal();
  };

  const isReadOnly = modalMode === "view";

  return (
    <div className="relative w-full h-full">
      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
          {/* ✅ FIXED WIDTHS to avoid huge gap */}
          <colgroup><col style={{ width: "6rem" }} /><col style={{ width: "28rem" }} /><col style={{ width: "20rem" }} /><col style={{ width: "8rem" }} /></colgroup>

          {/* ✅ SAME HEADER STYLE AS TestPanels */}
          <thead className="bg-green-50 text-gray-700">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase">ORDER</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase">NAME</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase">
                INTERPRETATION
              </th>
              {/* ✅ ACTION heading added */}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                ACTION
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-900">
            {tests.map((t, idx) => {
              const hasInterpretation = !!t.interpretation?.trim();

              return (
                <tr
                  key={t._id}
                  className="border-t border-slate-200 hover:bg-slate-50 align-top"
                >
                  {/* ORDER */}
                  <td className="px-4 py-3 text-gray-700">{idx + 1}.</td>

                  {/* NAME */}
                  <td className="px-4 py-3 font-medium truncate">{t.testName}</td>

                  {/* INTERPRETATION */}
                  <td className="px-4 py-3">
                    {hasInterpretation ? (
                      <span className="text-slate-400 cursor-default select-none">
                        Type interpretation
                      </span>
                    ) : (
                      <button
                        onClick={() => openModal(t, "add")}
                        className="text-blue-700 hover:underline"
                      >
                        Type interpretation
                      </button>
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => hasInterpretation && openModal(t, "view")}
                        disabled={!hasInterpretation}
                        className={`text-sm ${
                          hasInterpretation
                            ? "text-blue-600 hover:underline"
                            : "text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        View
                      </button>

                      <button
                        onClick={() =>
                          hasInterpretation
                            ? openModal(t, "edit")
                            : openModal(t, "add")
                        }
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {tests.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No tests found.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {selectedTest.testName}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "Saved interpretation is shown below."
                    : "Type / edit interpretation for this test below."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 rounded-full px-2.5 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Interpretation
            </label>
            <textarea
              className={`mt-2 h-64 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
                isReadOnly ? "bg-slate-50 cursor-default" : ""
              }`}
              placeholder="Type or paste interpretation here..."
              value={interpretationText}
              onChange={(e) => setInterpretationText(e.target.value)}
              readOnly={isReadOnly}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              {modalMode !== "view" && (
                <button
                  onClick={handleSave}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

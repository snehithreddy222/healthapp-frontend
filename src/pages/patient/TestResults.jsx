// src/pages/patient/TestResults.jsx
import React, { useMemo, useState } from "react";
import { FiDownload, FiSearch } from "react-icons/fi";
import { format } from "date-fns";

const MOCK_RESULTS = [
  {
    id: "r1",
    name: "Comprehensive Metabolic Panel",
    date: new Date(2023, 9, 20), // Oct 20, 2023
    status: "available",
  },
  {
    id: "r2",
    name: "Lipid Panel",
    date: new Date(2023, 9, 20),
    status: "available",
  },
  {
    id: "r3",
    name: "Thyroid Panel (TSH)",
    date: new Date(2023, 8, 15),
    status: "available",
  },
  {
    id: "r4",
    name: "Complete Blood Count (CBC)",
    date: new Date(2023, 7, 1),
    status: "archived",
  },
  {
    id: "r5",
    name: "Urinalysis",
    date: new Date(2023, 6, 22),
    status: "archived",
  },
];

function StatusPill({ status }) {
  const isAvailable = status === "available";
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 h-7 rounded-full text-xs font-medium border",
        isAvailable
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-sky-50 text-sky-700 border-sky-200",
      ].join(" ")}
    >
      {isAvailable ? "Available" : "Archived"}
    </span>
  );
}

export default function TestResults() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!query.trim()) return MOCK_RESULTS;
    const q = query.toLowerCase();
    return MOCK_RESULTS.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="px-6 pb-10 mx-auto max-w-7xl">
      {/* page header */}
      <div className="mt-6">
        <h1 className="text-[32px] font-bold tracking-tight">Test Results</h1>
        <p className="text-gray-600">
          Review your recent and past laboratory results.
        </p>
      </div>

      {/* local search (like mock) */}
      <div className="mt-6">
        <div className="search-pill max-w-lg">
          <FiSearch className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search test results..."
            className="search-input"
          />
        </div>
      </div>

      {/* table card */}
      <div className="card-soft mt-6 p-0 overflow-hidden">
        {/* table header */}
        <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider border-b border-gray-200/70">
          <div className="col-span-6">TEST NAME</div>
          <div className="col-span-2">DATE</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2 text-right">ACTIONS</div>
        </div>

        {/* rows */}
        {rows.map((r, idx) => (
          <div
            key={r.id}
            className={[
              "grid grid-cols-12 items-center px-6 py-4 text-[15px]",
              "border-b border-gray-200/70",
              "hover:bg-gray-50/70 transition-colors",
              idx === rows.length - 1 ? "border-b-0" : "",
            ].join(" ")}
          >
            <div className="col-span-6 text-gray-900">{r.name}</div>
            <div className="col-span-2 text-gray-700">
              {format(r.date, "MMM dd, yyyy")}
            </div>
            <div className="col-span-2">
              <StatusPill status={r.status} />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-4">
              <button className="text-sky-700 hover:text-sky-800 text-sm font-medium">
                View Details
              </button>
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Download"
                title="Download"
              >
                <FiDownload className="text-gray-600" />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            No results found.
          </div>
        )}
      </div>
    </div>
  );
}

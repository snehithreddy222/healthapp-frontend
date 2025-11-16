// frontend/src/pages/patient/Medications.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { medicationService } from "../../services/medicationService";

function Pill({ kind = "green", children }) {
  const cls =
    kind === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 h-7 rounded-full text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

export default function Medications() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await medicationService.list();
        if (!mounted) return;
        setRows(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const hay = [
        r.medicationName,
        r.dosage,
        r.frequency,
        r.doctorName,
        r.doctorSpecialization,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">Your Medications</h1>
        <p className="text-gray-500">A list of your current and past prescriptions.</p>
      </div>

      <div className="mb-6">
        <div className="search-pill max-w-md">
          <FiSearch className="text-gray-400" />
          <input
            className="search-input"
            placeholder="Search medications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-500 bg-gray-50">
          <div className="col-span-3">MEDICATION</div>
          <div className="col-span-2">DOSAGE</div>
          <div className="col-span-2">FREQUENCY</div>
          <div className="col-span-3">PRESCRIBING DOCTOR</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1">REFILL DUE</div>
        </div>

        {loading && (
          <div className="px-5 py-10 text-gray-500">Loading…</div>
        )}

        {!loading &&
          filtered.map((r, i) => (
            <div
              key={r.id}
              className={[
                "grid grid-cols-12 items-center px-5 py-4 text-[15px] border-t border-gray-100",
                i === 0 ? "border-t-0" : "",
              ].join(" ")}
            >
              <div className="col-span-3 text-gray-900">{r.medicationName}</div>
              <div className="col-span-2 text-gray-800">{r.dosage}</div>
              <div className="col-span-2 text-gray-800">{r.frequency}</div>
              <div className="col-span-3 text-gray-800">
                {r.doctorName}
                {r.doctorSpecialization ? (
                  <span className="text-gray-500"> • {r.doctorSpecialization}</span>
                ) : null}
              </div>
              <div className="col-span-1">
                <Pill kind={r.status === "Active" ? "green" : "gray"}>{r.status}</Pill>
              </div>
              <div className="col-span-1 text-gray-800">
                {r.refillDue ? format(new Date(r.refillDue), "MMM dd, yyyy") : "—"}
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-gray-500">No medications found.</div>
        )}
      </div>
    </div>
  );
}

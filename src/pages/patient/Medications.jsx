import React from "react";

export default function Medications() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">Your Medications</h1>
        <p className="text-gray-500">A list of your current and past prescriptions.</p>
      </div>

      <div className="mb-6">
        <div className="search-pill max-w-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <input className="search-input" placeholder="Search medications..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-5 py-3">MEDICATION</th>
              <th className="text-left font-medium px-5 py-3">DOSAGE</th>
              <th className="text-left font-medium px-5 py-3">FREQUENCY</th>
              <th className="text-left font-medium px-5 py-3">PRESCRIBING DOCTOR</th>
              <th className="text-left font-medium px-5 py-3">STATUS</th>
              <th className="text-left font-medium px-5 py-3">REFILL DUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-5 py-4">Lisinopril</td>
              <td className="px-5 py-4">10mg</td>
              <td className="px-5 py-4">Once daily</td>
              <td className="px-5 py-4">Dr. Evelyn Reed</td>
              <td className="px-5 py-4"><span className="pill-green">Active</span></td>
              <td className="px-5 py-4">Dec 15, 2023</td>
            </tr>
            <tr>
              <td className="px-5 py-4">Metformin</td>
              <td className="px-5 py-4">500mg</td>
              <td className="px-5 py-4">Twice daily</td>
              <td className="px-5 py-4">Dr. Evelyn Reed</td>
              <td className="px-5 py-4"><span className="pill-green">Active</span></td>
              <td className="px-5 py-4">Nov 30, 2023</td>
            </tr>
            {/* ...other rows... */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

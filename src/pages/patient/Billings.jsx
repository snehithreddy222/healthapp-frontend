// src/pages/patient/Billings.jsx
import React from "react";
import { FiCreditCard, FiFileText } from "react-icons/fi";

const StatusPill = ({ kind }) => {
  const map = {
    due:    "bg-amber-50 text-amber-700 border border-amber-200",
    paid:   "bg-green-50 text-green-700 border border-green-200",
  };
  const label = { due: "Due", paid: "Paid" }[kind] || kind;
  return <span className={`px-2.5 h-6 inline-flex items-center rounded-full text-xs font-medium ${map[kind]}`}>{label}</span>;
};

export default function Billings() {
  return (
    <div className="main-inner">{/* no spacer before the title */}
      {/* Header */}
      <h1 className="text-[32px] leading-[38px] font-extrabold tracking-tight text-gray-900">
        Billings & Payments
      </h1>
      <p className="mt-2 text-gray-500">
        View and manage your medical bills.
      </p>

      {/* Content */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Billing table (spans 2) */}
        <div className="xl:col-span-2 card-soft">
          <div className="text-base font-semibold mb-3">Billing History</div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr className="[&>th]:px-5 [&>th]:py-3 text-left">
                  <th>DATE</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr className="[&>td]:px-5 [&>td]:py-4">
                  <td className="text-gray-700">
                    <div>Oct 15,</div><div>2023</div>
                  </td>
                  <td className="text-gray-900">Annual Physical Exam</td>
                  <td className="text-gray-900">$75.00</td>
                  <td><StatusPill kind="due" /></td>
                  <td>
                    <button className="text-sky-700 hover:text-sky-800 font-medium">
                      Pay Now
                    </button>
                  </td>
                </tr>

                <tr className="[&>td]:px-5 [&>td]:py-4">
                  <td className="text-gray-700">
                    <div>Sep 22,</div><div>2023</div>
                  </td>
                  <td className="text-gray-900">Lab Work - Blood Panel</td>
                  <td className="text-gray-900">$120.00</td>
                  <td><StatusPill kind="paid" /></td>
                  <td>
                    <button className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-medium">
                      <FiFileText className="text-[16px]" /> View Receipt
                    </button>
                  </td>
                </tr>

                <tr className="[&>td]:px-5 [&>td]:py-4">
                  <td className="text-gray-700">
                    <div>Aug 05,</div><div>2023</div>
                  </td>
                  <td className="text-gray-900">Follow-up Consultation</td>
                  <td className="text-gray-900">$50.00</td>
                  <td><StatusPill kind="paid" /></td>
                  <td>
                    <button className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-medium">
                      <FiFileText className="text-[16px]" /> View Receipt
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Balance & Payment methods */}
        <aside className="space-y-6">
          {/* Current Balance */}
          <div className="card-soft">
            <div className="text-base font-semibold mb-3">Current Balance</div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm text-amber-800 mb-1">Outstanding balance:</div>
              <div className="text-4xl font-extrabold text-amber-900">$75.00</div>
              <div className="mt-1 text-sm text-amber-800">Due by Nov 15, 2023</div>
            </div>

            <button className="btn-primary w-full mt-4">
              Pay Full Amount
            </button>
          </div>

          {/* Payment Methods */}
          <div className="card-soft">
            <div className="text-base font-semibold mb-3">Payment Methods</div>
            <div className="rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 grid place-items-center">
                <FiCreditCard className="text-gray-600 text-[18px]" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Visa ending in 1234</div>
                <div className="text-sm text-gray-500">Expires 12/2025</div>
              </div>
            </div>

            <button className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Manage Payment Methods
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

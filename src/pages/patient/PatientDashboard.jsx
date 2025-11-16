// src/pages/patient/PatientDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiMessageSquare, FiDroplet, FiHeart } from "react-icons/fi";

export default function PatientDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Title */}
      <h1 className="text-3xl sm:text-[32px] font-extrabold tracking-tight text-gray-900">
        Welcome back, akhurath222!
      </h1>
      <p className="mt-2 text-gray-600">
        Here is a summary of your health records.
      </p>

      {/* Top 3 cards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Upcoming */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiCalendar />
            </div>
            <h2 className="text-[15px] font-semibold">Upcoming Appointments</h2>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 p-4">
              <div className="date-tile">
                <div className="text-[10px] text-sky-700 font-semibold">OCT</div>
                <div className="text-xl font-extrabold text-sky-700 leading-none">28</div>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">Annual Physical Exam</p>
                <p className="text-sm text-gray-600">
                  10:30 AM with Dr. Evelyn Reed (Cardiology)
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/patient/appointments"
            className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline"
          >
            View All Appointments
          </Link>
        </section>

        {/* Unread */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiMessageSquare />
            </div>
            <h2 className="text-[15px] font-semibold">Unread Messages</h2>
            <span className="pill-red ml-auto">3</span>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="font-medium text-gray-900">Dr. Alan Grant</p>
            <p className="text-sm text-gray-600 truncate">
              Regarding your recent lab results…
            </p>
            <Link
              to="/patient/messages"
              className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline"
            >
              Go to Inbox
            </Link>
          </div>
        </section>

        {/* Lab results */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiDroplet />
            </div>
            <h2 className="text-[15px] font-semibold">Recent Test Results</h2>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="font-medium text-gray-900">
              Comprehensive Metabolic Panel
            </p>
            <span className="pill-green mt-2">Available</span>
            <p className="text-sm text-gray-600 mt-2">
              Results from Oct 20, 2023 are ready for review.
            </p>
            <Link
              to="/patient/test-results"
              className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline"
            >
              View Details
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Medications */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiHeart />
            </div>
            <h2 className="text-[15px] font-semibold">Active Medications</h2>
            <Link
              to="/patient/medications"
              className="ml-auto text-sm font-medium text-sky-700 hover:underline"
            >
              View Full List
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200">
            <div className="p-4">
              <p className="font-medium text-gray-900">Lisinopril (10mg)</p>
              <p className="text-sm text-gray-600">1 daily</p>
            </div>
            <div className="divider" />
            <div className="p-4">
              <p className="font-medium text-gray-900">Metformin (500mg)</p>
              <p className="text-sm text-gray-600">2 daily</p>
            </div>
          </div>
        </section>

        {/* Bills */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-amber">
              <span className="font-semibold">≡</span>
            </div>
            <h2 className="text-[15px] font-semibold">Outstanding Bills</h2>
            <Link
              to="/patient/billings"
              className="ml-auto text-sm font-medium text-sky-700 hover:underline"
            >
              View Billing Details
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">You have an outstanding balance:</p>
            <p className="mt-1 text-4xl font-extrabold text-amber-900">$75.00</p>
            <p className="text-sm text-amber-900 mt-1">Due by Nov 15, 2023</p>
          </div>
        </section>
      </div>
    </div>
  );
}

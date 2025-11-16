// src/pages/patient/PatientDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiMessageSquare,
  FiDroplet,
  FiHeart,
  FiCreditCard,
} from "react-icons/fi";

import { appointmentService } from "../../services/appointmentService";
import { billingService } from "../../services/billingService";
import { messageService } from "../../services/messageService";
import { patientService } from "../../services/patientService";
import { testResultsService } from "../../services/testResultsService";
import { authService } from "../../services/authService";

function dollars(cents) {
  if (typeof cents !== "number") return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function PatientDashboard() {
  const [displayName, setDisplayName] = useState("");
  const [upcoming, setUpcoming] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [meRes, upcomingRes, unreadRes, invoicesRes, testResultsRes] =
          await Promise.allSettled([
            patientService.me(),
            appointmentService.listUpcoming(),
            messageService.getUnreadCount(),
            billingService.list(),
            testResultsService.list({ limit: 5 }).catch(() => ({ items: [] })),
          ]);

        if (cancelled) return;

        // Name
        let name = "";
        if (meRes.status === "fulfilled" && meRes.value) {
          const me = meRes.value;
          if (me.firstName) {
            name = me.lastName ? `${me.firstName} ${me.lastName}` : me.firstName;
          } else if (me.username) {
            name = me.username;
          }
        }
        if (!name) {
          const u = authService.getCurrentUser();
          if (u?.username) name = u.username;
        }
        setDisplayName(name || "there");

        // Upcoming appointments
        if (upcomingRes.status === "fulfilled") {
          const list = Array.isArray(upcomingRes.value)
            ? upcomingRes.value
            : [];
          setUpcoming(list.length ? list[0] : null);
        }

        // Unread messages
        if (unreadRes.status === "fulfilled") {
          setUnreadCount(
            typeof unreadRes.value === "number" ? unreadRes.value : 0
          );
        }

        // Invoices
        if (invoicesRes.status === "fulfilled") {
          const inv = Array.isArray(invoicesRes.value)
            ? invoicesRes.value
            : [];
          setInvoices(inv);
        }

        // Latest test result
        if (testResultsRes.status === "fulfilled") {
          const items = testResultsRes.value?.items || [];
          if (items.length) {
            const withDate = items.filter(
              (r) => r.date || r.performedAt || r.createdAt
            );
            let latest = null;
            if (withDate.length) {
              latest = withDate.reduce((best, r) => {
                const dStr =
                  r.date || r.performedAt || r.createdAt || r.updatedAt;
                const d = dStr ? new Date(dStr) : null;
                if (!d) return best || r;
                if (!best) return r;
                const bestD = new Date(
                  best.date ||
                    best.performedAt ||
                    best.createdAt ||
                    best.updatedAt
                );
                return d > bestD ? r : best;
              }, null);
            } else {
              latest = items[0];
            }
            setLatestResult(latest);
          } else {
            setLatestResult(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(
    () => `Welcome back, ${displayName || "there"}!`,
    [displayName]
  );

  // Billing derived state
  const dueInvoices = useMemo(
    () => invoices.filter((i) => i.status === "DUE"),
    [invoices]
  );

  const outstandingCents = useMemo(
    () => dueInvoices.reduce((sum, inv) => sum + (inv.amountCents || 0), 0),
    [dueInvoices]
  );

  const nextDueInvoice = useMemo(() => {
    if (!dueInvoices.length) return null;
    let best = null;
    for (const inv of dueInvoices) {
      if (!inv.dueDate) continue;
      if (!best) {
        best = inv;
      } else if (new Date(inv.dueDate) < new Date(best.dueDate)) {
        best = inv;
      }
    }
    return best || dueInvoices[0];
  }, [dueInvoices]);

  const nextDueText = nextDueInvoice?.dueDate
    ? `Due by ${formatDate(nextDueInvoice.dueDate)}`
    : outstandingCents > 0
    ? "Payment due soon"
    : "You are all caught up";

  const hasUpcoming = !!upcoming;

  const upcomingBadge = hasUpcoming
    ? appointmentService.toBadge(upcoming.date)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-2 sm:py-3 lg:py-4">
      {/* Header strip */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 px-4 sm:px-6 py-3 sm:py-4 lg:py-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-gray-900">
            {greeting}
          </h1>
          <p className="mt-1 text-xs sm:text-sm lg:text-[14px] text-gray-600 max-w-xl">
            Here is a quick snapshot of your appointments, messages, test
            results, and bills.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-end">
          <Link
            to="/patient/appointments/new"
            className="w-full xs:w-auto inline-flex items-center justify-center rounded-lg border border-sky-200 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Schedule visit
          </Link>
          <Link
            to="/patient/messages"
            className="w-full xs:w-auto inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Message doctor
          </Link>
        </div>
      </div>

      {/* Top stats strip */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Next appointment */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">
              Next appointment
            </p>
            {loading && !hasUpcoming ? (
              <p className="mt-1 text-sm text-gray-400">Loading…</p>
            ) : hasUpcoming ? (
              <>
                <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
                  {upcoming.title || "Upcoming visit"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(upcoming.date)} at {upcoming.time}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                No upcoming visits scheduled.
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-sky-700">
            <FiCalendar className="text-[18px]" />
          </div>
        </div>

        {/* Unread messages */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500">
              Unread messages
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {unreadCount > 99 ? "99+" : unreadCount}
            </p>
            <p className="text-xs text-gray-500">
              {unreadCount > 0
                ? "Tap to review your inbox."
                : "You are all caught up."}
            </p>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-sky-700">
            <FiMessageSquare className="text-[18px]" />
          </div>
        </div>

        {/* Outstanding balance */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500">
              Outstanding balance
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {dollars(outstandingCents)}
            </p>
            <p className="text-xs text-gray-500">{nextDueText}</p>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
            <FiCreditCard className="text-[18px]" />
          </div>
        </div>

        {/* Latest lab result */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">
              Latest lab result
            </p>
            {latestResult ? (
              <>
                <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
                  {latestResult.name ||
                    latestResult.title ||
                    latestResult.testName ||
                    "Lab result"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(
                    latestResult.date ||
                      latestResult.performedAt ||
                      latestResult.createdAt ||
                      latestResult.updatedAt
                  )}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                No recent tests on file.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main cards grid – five cards packed into two rows on desktop */}
      <div className="mt-3 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* Upcoming Appointments */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiCalendar />
            </div>
            <h2 className="text-[15px] font-semibold">
              Upcoming Appointments
            </h2>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white">
            {loading && !hasUpcoming ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : hasUpcoming ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                <div className="date-tile">
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[11px] font-semibold text-sky-700 tracking-wide">
                      {upcomingBadge?.mon}
                    </span>
                    <span className="text-2xl font-extrabold text-sky-800">
                      {upcomingBadge?.day}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {upcoming.title || "Upcoming visit"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {upcoming.time}{" "}
                    {upcoming.clinicianName
                      ? `with ${upcoming.clinicianName}`
                      : ""}
                    {upcoming.specialty ? ` (${upcoming.specialty})` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-500">
                You have no upcoming appointments.
              </div>
            )}
          </div>

          <Link
            to="/patient/appointments"
            className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline"
          >
            View all appointments
          </Link>
        </section>

        {/* Unread Messages */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiMessageSquare />
            </div>
            <h2 className="text-[15px] font-semibold">Unread Messages</h2>
            {unreadCount > 0 ? (
              <span className="pill-red ml-auto">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span className="ml-auto text-xs font-medium text-gray-400">
                0
              </span>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            {unreadCount > 0 ? (
              <>
                <p className="font-medium text-gray-900">
                  You have {unreadCount} unread message
                  {unreadCount > 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Review messages from your care team.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900">
                  You are all caught up.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  There are no new messages from your providers.
                </p>
              </>
            )}

            <Link
              to="/patient/messages"
              className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline"
            >
              Go to inbox
            </Link>
          </div>
        </section>

        {/* Recent Test Results */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <div className="tile tile-blue">
              <FiDroplet />
            </div>
            <h2 className="text-[15px] font-semibold">Recent Test Results</h2>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            {latestResult ? (
              <>
                <p className="font-medium text-gray-900">
                  {latestResult.name ||
                    latestResult.title ||
                    latestResult.testName ||
                    "Lab result"}
                </p>
                <span className="pill-green mt-2">Available</span>
                <p className="text-sm text-gray-600 mt-2">
                  Results from{" "}
                  {formatDate(
                    latestResult.date ||
                      latestResult.performedAt ||
                      latestResult.createdAt ||
                      latestResult.updatedAt
                  )}{" "}
                  are ready for review.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900">
                  No recent test results.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  When your provider orders lab work, it will appear here.
                </p>
              </>
            )}

            <Link
              to="/patient/test-results"
              className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline"
            >
              View details
            </Link>
          </div>
        </section>

        {/* Active Medications */}
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
              View full list
            </Link>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-medium text-gray-900">
              No active medications recorded.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              When your doctor adds prescriptions to your chart, they will
              appear here.
            </p>
          </div>
        </section>

        {/* Outstanding Bills */}
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
              View billing details
            </Link>
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              You have an outstanding balance:
            </p>
            <p className="mt-1 text-3xl font-extrabold text-amber-900">
              {dollars(outstandingCents)}
            </p>
            <p className="text-sm text-amber-900 mt-1">{nextDueText}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

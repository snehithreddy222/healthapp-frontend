// src/pages/doctor/DoctorDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  FiRefreshCw,
  FiCalendar,
  FiClock,
  FiUser,
  FiAlertCircle,
} from "react-icons/fi";

import { doctorScheduleService } from "../../services/doctorScheduleService";

// Parse "YYYY-MM-DD" as a local date, so we avoid off-by-one issues.
function parseIsoDateLocal(dateISO) {
  if (!dateISO) return new Date();
  const parts = String(dateISO).split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  return new Date(dateISO);
}

export default function DoctorDashboard() {
  const [selectedDate, setSelectedDate] = useState(
    doctorScheduleService.todayISO()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState([]);

  async function loadSchedule(date) {
    setLoading(true);
    setError("");
    try {
      const list = await doctorScheduleService.listSchedule(date);
      setAppointments(list);
      setSelectedAppt(null);
      setHistory([]);
      setHistoryError("");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load schedule";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistoryFor(appt) {
    if (!appt?.patientId) return;
    setSelectedAppt(appt);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const list = await doctorScheduleService.listPatientHistory(
        appt.patientId
      );
      setHistory(list);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load visit history";
      setHistoryError(msg);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule(selectedDate);
  }, [selectedDate]);

  const hasAppointments = appointments.length > 0;

  function handleDateChange(e) {
    setSelectedDate(e.target.value);
  }

  function renderStatusPill(status) {
    const s = String(status || "").toUpperCase();
    let label = s;
    let base = "bg-slate-100 text-slate-700";

    if (s === "SCHEDULED") {
      label = "Scheduled";
      base = "bg-sky-50 text-sky-700 border border-sky-100";
    } else if (s === "COMPLETED") {
      label = "Completed";
      base = "bg-emerald-50 text-emerald-700 border border-emerald-100";
    } else if (s === "CANCELLED") {
      label = "Cancelled";
      base = "bg-rose-50 text-rose-700 border border-rose-100";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${base}`}
      >
        {label}
      </span>
    );
  }

  const dayDate = useMemo(
    () => parseIsoDateLocal(selectedDate),
    [selectedDate]
  );

  const dayLabel = format(dayDate, "EEEE, dd MMM yyyy");

  // Badge should always show the SELECTED day (not the raw UTC dateTime),
  // so we compute it once from selectedDate.
  const badgeForSelected = useMemo(() => {
    const mon = dayDate
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const day = String(dayDate.getDate()).padStart(2, "0");
    return { mon, day };
  }, [dayDate]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Schedule
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            Review your appointments for any day. Click a patient to see their
            visit history with you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <FiCalendar className="text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="border-none bg-transparent text-sm text-slate-900 focus:outline-none focus:ring-0"
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => loadSchedule(selectedDate)}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 transition"
          >
            <FiRefreshCw className="text-xs" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main content: schedule + history */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 items-start">
        {/* Schedule card */}
        <div className="card-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Day overview
              </h2>
              <p className="text-xs text-slate-500">{dayLabel}</p>
            </div>
            <p className="text-xs text-slate-500">
              {appointments.length}{" "}
              {appointments.length === 1 ? "appointment" : "appointments"}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <p className="text-xs text-slate-500">
                  Loading schedule…
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-2">
                <FiAlertCircle className="text-lg" />
              </div>
              <p className="text-sm font-medium text-rose-700">
                Unable to load schedule
              </p>
              <p className="mt-1 text-xs text-rose-500 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => loadSchedule(selectedDate)}
                className="mt-4 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !hasAppointments && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600 mb-2">
                <FiClock className="text-lg" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                No appointments scheduled for this day
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Choose another date from the picker above to review past or
                upcoming days.
              </p>
            </div>
          )}

          {/* Schedule list */}
          {!loading && !error && hasAppointments && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.4fr)_120px] bg-slate-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span>Time</span>
                <span>Patient</span>
                <span>Reason</span>
                <span>Status</span>
              </div>

              <ul className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const selected = selectedAppt?.id === appt.id;
                  return (
                    <li key={appt.id}>
                      <button
                        type="button"
                        onClick={() => loadHistoryFor(appt)}
                        className={[
                          "w-full flex flex-col md:grid md:grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.4fr)_120px] gap-3 px-4 py-3 text-left transition",
                          selected ? "bg-sky-50/80" : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        {/* Time */}
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <div className="hidden md:flex flex-col items-center justify-center rounded-lg bg-slate-100 px-2 py-1">
                            <span className="text-[10px] font-semibold text-slate-500">
                              {badgeForSelected.mon}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {badgeForSelected.day}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-xs md:text-sm">
                              {appt.time}
                            </p>
                            <p className="md:hidden text-[11px] text-slate-500">
                              {badgeForSelected.mon} {badgeForSelected.day}
                            </p>
                          </div>
                        </div>

                        {/* Patient */}
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                            {appt.patientInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {appt.patientName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {appt.patientPhone || "Phone not provided"}
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="flex items-center">
                          <p className="text-xs md:text-sm text-slate-700 line-clamp-2">
                            {appt.reason || "Consultation"}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center md:justify-end">
                          {renderStatusPill(appt.status)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Patient history card */}
        <div className="card-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Patient visit history
              </h2>
              <p className="text-xs text-slate-500">
                Select a patient from today’s schedule to see all their
                appointments with you.
              </p>
            </div>
          </div>

          {!selectedAppt && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-2">
                <FiUser className="text-lg" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                No patient selected
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Click any appointment on the left to quickly review that
                patient’s previous and upcoming visits.
              </p>
            </div>
          )}

          {selectedAppt && (
            <>
              {/* Patient header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                  {selectedAppt.patientInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {selectedAppt.patientName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {selectedAppt.patientPhone || "Phone not provided"}
                  </p>
                </div>
              </div>

              {/* History states */}
              {historyLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <p className="text-xs text-slate-500">
                      Loading visit history…
                    </p>
                  </div>
                </div>
              )}

              {!historyLoading && historyError && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-2">
                    <FiAlertCircle className="text-base" />
                  </div>
                  <p className="text-sm font-medium text-rose-700">
                    Unable to load visit history
                  </p>
                  <p className="mt-1 text-xs text-rose-500 max-w-xs">
                    {historyError}
                  </p>
                  <button
                    type="button"
                    onClick={() => loadHistoryFor(selectedAppt)}
                    className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!historyLoading && !historyError && history.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    No other visits found
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    This might be this patient’s first appointment with you.
                  </p>
                </div>
              )}

              {!historyLoading && !historyError && history.length > 0 && (
                <div className="mt-2 max-h-[360px] overflow-y-auto space-y-2">
                  {history.map((appt) => (
                    <div
                      key={appt.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">
                          {format(new Date(appt.dateTime), "dd MMM yyyy")}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          {format(new Date(appt.dateTime), "HH:mm")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700 line-clamp-2">
                        {appt.reason || "Consultation"}
                      </p>
                      <div className="mt-2">
                        {renderStatusPill(appt.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

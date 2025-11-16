// src/pages/doctor/DoctorSchedule.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { appointmentService } from "../../services/appointmentService";

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

export default function DoctorSchedule() {
  const [selectedDate, setSelectedDate] = useState(
    appointmentService.todayISO()
  );
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dayLabel = format(
    parseIsoDateLocal(selectedDate),
    "EEEE, d MMM yyyy"
  );

  async function loadSchedule(date) {
    setLoading(true);
    setError("");
    try {
      const list = await appointmentService.listDoctorForDate(date);
      setAppointments(list);
    } catch (e) {
      console.error(e);
      setError("Unable to load schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleRefresh = () => {
    loadSchedule(selectedDate);
  };

  const total = appointments.length;

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Review your appointments for a given day. You can quickly scan who
            you are seeing next and how your day is filling up.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="input h-10"
          />
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center px-3 h-10 rounded-md border border-sky-200 bg-white text-sky-700 text-sm font-medium hover:bg-sky-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="card-soft">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Day overview
            </p>
            <p className="text-xs text-slate-500">{dayLabel}</p>
          </div>
          <p className="text-xs text-slate-500">
            {total === 0
              ? "No appointments"
              : total === 1
              ? "1 appointment"
              : `${total} appointments`}
          </p>
        </div>

        <div className="border-t border-slate-200 mt-2 pt-2">
          {loading && (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading schedule…
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-rose-600 mb-2">
                Unable to load schedule
              </p>
              <p className="text-xs text-slate-500 mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-4 h-9 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No appointments scheduled for this day.
            </div>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[80px_minmax(0,1.5fr)_minmax(0,1.2fr)_110px] gap-4 px-2 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                <span>Time</span>
                <span>Patient</span>
                <span>Reason</span>
                <span className="text-right">Status</span>
              </div>

              {appointments.map((appt) => {
                const badge = appointmentService.toBadge(appt.date);
                return (
                  <div
                    key={appt.id}
                    className="grid grid-cols-[80px_minmax(0,1.5fr)_minmax(0,1.2fr)_110px] gap-4 px-2 py-3 items-center hover:bg-slate-50 transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-[11px] font-semibold text-slate-700">
                        <span className="text-[10px]">{badge.mon}</span>
                        <span className="text-[15px] leading-none">
                          {badge.day}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">
                        <div className="font-medium text-[13px]">
                          {appt.time}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-800">
                      <div className="font-medium">
                        {appt.patientName || "Patient"}
                      </div>
                      {appt.patientPhone && (
                        <div className="text-slate-500 text-[11px]">
                          {appt.patientPhone}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 truncate">
                      {appt.title}
                    </div>

                    <div className="flex justify-end">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700">
                        {appt.status === "SCHEDULED"
                          ? "Scheduled"
                          : appt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

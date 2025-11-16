// src/pages/doctor/DoctorPatients.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  FiSearch,
  FiUser,
  FiAlertCircle,
  FiChevronRight,
} from "react-icons/fi";

import { doctorPatientService } from "../../services/doctorPatientService";
import { doctorScheduleService } from "../../services/doctorScheduleService";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  async function loadPatients(query) {
    setLoading(true);
    setError("");

    try {
      const list = await doctorPatientService.listMyPatients(query);
      setPatients(list);

      // Keep selection stable when reloading/searching
      let nextSelected = null;
      if (selectedPatient) {
        nextSelected = list.find((p) => p.id === selectedPatient.id) || null;
      }
      if (!nextSelected && list.length > 0) {
        nextSelected = list[0];
      }
      setSelectedPatient(nextSelected);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load patients";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(patientId) {
    if (!patientId) {
      setHistory([]);
      setHistoryError("");
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const list = await doctorScheduleService.listPatientHistory(patientId);
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
    loadPatients("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadHistory(selectedPatient.id);
    } else {
      setHistory([]);
      setHistoryError("");
    }
  }, [selectedPatient]);

  const hasPatients = patients.length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    loadPatients(search);
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

  function formatLastVisitDate(d) {
    if (!d) return "No visits yet";
    try {
      return format(d, "dd MMM yyyy");
    } catch {
      return "No visits yet";
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My patients
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            See the patients you are currently treating. Select a patient to
            review their visit history with you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <FiSearch className="text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main content: patients list + history */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-6 items-start">
        {/* Patients list */}
        <div className="card-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Assigned patients
              </h2>
              <p className="text-xs text-slate-500">
                Patients with at least one appointment with you.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {patients.length}{" "}
              {patients.length === 1 ? "patient" : "patients"}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <p className="text-xs text-slate-500">
                  Loading your patients…
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
                Unable to load patients
              </p>
              <p className="mt-1 text-xs text-rose-500 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => loadPatients(search)}
                className="mt-4 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !hasPatients && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-2">
                <FiUser className="text-lg" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                You have no patients yet
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Once patients start booking appointments with you, they will
                appear here.
              </p>
            </div>
          )}

          {/* Patients list */}
          {!loading && !error && hasPatients && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_40px] bg-slate-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span>Patient</span>
                <span>Contact</span>
                <span>Last visit</span>
                <span />
              </div>

              <ul className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const selected = selectedPatient?.id === p.id;
                  const lastVisitLabel = formatLastVisitDate(
                    p.lastVisitDate
                  );

                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(p)}
                        className={[
                          "w-full flex flex-col md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_40px] gap-3 px-4 py-3 text-left transition",
                          selected ? "bg-sky-50/80" : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        {/* Patient */}
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                            {p.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {p.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {p.gender && p.age != null
                                ? `${p.gender}, ${p.age} yrs`
                                : p.gender || (p.age != null
                                  ? `${p.age} yrs`
                                  : "Demographics not provided")}
                            </p>
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="flex items-center">
                          <p className="text-xs md:text-sm text-slate-700 truncate">
                            {p.phone || "Phone not provided"}
                          </p>
                        </div>

                        {/* Last visit */}
                        <div className="flex flex-col gap-1">
                          <p className="text-xs md:text-sm text-slate-900">
                            {lastVisitLabel}
                          </p>
                          {p.lastVisitReason && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {p.lastVisitReason}
                            </p>
                          )}
                        </div>

                        {/* Chevron */}
                        <div className="flex items-center justify-end">
                          <FiChevronRight className="text-slate-400" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Patient details + history */}
        <div className="card-soft">
          {!selectedPatient && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-2">
                <FiUser className="text-lg" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                No patient selected
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Select a patient from the list on the left to see their recent
                visits and details.
              </p>
            </div>
          )}

          {selectedPatient && (
            <>
              {/* Patient header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                    {selectedPatient.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedPatient.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedPatient.phone || "Phone not provided"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-500">
                    Total visits
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedPatient.visitCount || 0}
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
                    onClick={() => loadHistory(selectedPatient.id)}
                    className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!historyLoading && !historyError && history.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    No previous visits found
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    Once you have more visits with this patient, they will show
                    up here.
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
                          {format(appt.dateTime, "dd MMM yyyy")}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          {format(appt.dateTime, "HH:mm")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700 line-clamp-2">
                        {appt.reason || "Consultation"}
                      </p>
                      <div className="mt-2">{renderStatusPill(appt.status)}</div>
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

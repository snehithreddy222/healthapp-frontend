// src/pages/doctor/DoctorTestResults.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiDownload, FiSearch, FiRefreshCw } from "react-icons/fi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { testResultsService } from "../../services/testResultsService";

function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();
  const isFinal =
    normalized.includes("final") ||
    normalized.includes("ready") ||
    normalized.includes("completed") ||
    normalized.includes("avail");

  return (
    <span
      className={[
        "inline-flex items-center px-2.5 h-7 rounded-full text-xs font-medium border",
        isFinal
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
      ].join(" ")}
    >
      {isFinal ? "Final" : "Pending review"}
    </span>
  );
}

// Try to derive a patient name from flexible shapes
function getPatientName(row) {
  if (!row) return "Patient";
  if (row.patientName) return row.patientName;
  if (row.patientFullName) return row.patientFullName;
  if (row.patient?.fullName) return row.patient.fullName;

  const first =
    row.patientFirstName ||
    row.patient?.firstName ||
    row.firstName ||
    "";
  const last =
    row.patientLastName ||
    row.patient?.lastName ||
    row.lastName ||
    "";

  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || "Patient";
}

function getTestName(row) {
  if (!row) return "Lab result";
  return (
    row.testName ||
    row.name ||
    row.title ||
    row.panelName ||
    "Lab result"
  );
}

function getResultDate(row) {
  const value =
    row.resultDate ||
    row.date ||
    row.performedAt ||
    row.collectedAt ||
    row.createdAt ||
    row.updatedAt;
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function DoctorTestResults() {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const navigate = useNavigate();

  const loadResults = useCallback(async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const { items } = await testResultsService.list({ limit: 75 });
      const safeItems = Array.isArray(items) ? items : [];
      setResults(safeItems);
    } catch (e) {
      console.error("Failed to load doctor test results", e);
      const status = e?.response?.status;
      const body = e?.response?.data || {};
      const message = String(body.message || "").toLowerCase();

      if (
        status === 404 ||
        status === 204 ||
        message.includes("no results") ||
        message.includes("no lab results")
      ) {
        setResults([]);
        setErrorState(null);
      } else if (status === 401) {
        setResults([]);
        setErrorState({ type: "UNAUTH" });
      } else if (status === 403) {
        setResults([]);
        setErrorState({ type: "FORBIDDEN" });
      } else if (!status) {
        setResults([]);
        setErrorState({ type: "NETWORK" });
      } else {
        setResults([]);
        setErrorState({ type: "GENERIC" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const rows = useMemo(() => {
    if (!query.trim()) return results;
    const q = query.toLowerCase();
    return results.filter((r) => {
      const test = getTestName(r).toLowerCase();
      const patient = getPatientName(r).toLowerCase();
      const status = String(r.status || "").toLowerCase();
      return (
        test.includes(q) ||
        patient.includes(q) ||
        status.includes(q)
      );
    });
  }, [results, query]);

  async function handleDownload(row) {
    try {
      setDownloadingId(row.id);
      const url = testResultsService.downloadUrl(row.id);
      window.location.href = url;
    } catch (e) {
      console.error("download failed", e);
      alert("Unable to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  function renderErrorCard() {
    if (!errorState) return null;

    let title = "Unable to load lab results.";
    let description =
      "There was a temporary problem connecting to the server. Please try again in a moment.";
    let primaryAction = null;

    if (errorState.type === "UNAUTH") {
      title = "Your session has expired.";
      description =
        "Sign in again to review lab results for your patients.";
      primaryAction = (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          Go to sign in
        </button>
      );
    } else if (errorState.type === "FORBIDDEN") {
      title = "You do not have access to lab results.";
      description =
        "This account is not allowed to view lab results. Contact your administrator if this seems incorrect.";
    } else if (errorState.type === "NETWORK") {
      title = "We could not reach the server.";
      description =
        "Please check your network connection and try again.";
    }

    return (
      <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <span className="text-red-500 text-lg font-semibold">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>

          {primaryAction}

          {(errorState.type === "NETWORK" ||
            errorState.type === "GENERIC") && (
            <button
              type="button"
              onClick={loadResults}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              <FiRefreshCw className="text-[16px]" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pb-10 mx-auto max-w-7xl">
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight">
            Lab reviews
          </h1>
          <p className="text-gray-600 text-sm sm:text-[15px] max-w-xl">
            Review and download lab results for your patients.
          </p>
        </div>

        <div className="w-full md:w-auto flex gap-3 items-center">
          <div className="flex-1 md:flex-none md:w-64 search-pill">
            <FiSearch className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients or tests…"
              className="search-input"
            />
          </div>
          <button
            type="button"
            onClick={loadResults}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
          >
            <FiRefreshCw className="text-xs" />
            Refresh
          </button>
        </div>
      </div>

      <div className="card-soft mt-6 p-0 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 space-y-3">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-3/4 bg-gray-50 border border-dashed border-gray-200 rounded-lg animate-pulse" />
          </div>
        ) : errorState ? (
          renderErrorCard()
        ) : results.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              No lab results available.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              When labs are ordered for your patients and results are posted,
              they will appear here for review.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider border-b border-gray-200/70">
              <div className="col-span-4">PATIENT</div>
              <div className="col-span-4">TEST</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-2 text-right">STATUS / ACTIONS</div>
            </div>

            {rows.map((r, idx) => {
              const patientName = getPatientName(r);
              const testName = getTestName(r);
              const d = getResultDate(r);
              const isLast = idx === rows.length - 1;

              return (
                <div
                  key={r.id || idx}
                  className={[
                    "grid grid-cols-12 gap-y-1 items-center px-6 py-4 text-[15px]",
                    "border-b border-gray-200/70",
                    "hover:bg-gray-50/70 transition-colors",
                    isLast ? "border-b-0" : "",
                  ].join(" ")}
                >
                  <div className="col-span-12 sm:col-span-4 flex flex-col">
                    <span className="font-medium text-gray-900 truncate">
                      {patientName}
                    </span>
                    <span className="text-xs text-gray-500 sm:hidden">
                      {testName}
                    </span>
                  </div>

                  <div className="hidden sm:block col-span-4 text-gray-900 truncate">
                    {testName}
                  </div>

                  <div className="col-span-6 sm:col-span-2 text-gray-700 text-sm mt-1 sm:mt-0">
                    {d ? format(d, "MMM dd, yyyy") : "—"}
                  </div>

                  <div className="col-span-6 sm:col-span-2 mt-2 sm:mt-0 flex items-center justify-end gap-3">
                    <StatusPill status={r.status} />
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      title="Download"
                      onClick={() => handleDownload(r)}
                      disabled={downloadingId === r.id}
                    >
                      <FiDownload className="text-gray-600" />
                    </button>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && results.length > 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                No lab results match your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// src/components/common/Topbar.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiBell, FiMenu, FiX } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { patientService } from "../../services/patientService";
import { searchService } from "../../services/searchService";

export default function Topbar({ onMenuClick }) {
  const { user: ctxUser } = useAuth();
  const user = ctxUser || authService.getCurrentUser() || {};

  const initial =
    (user.username && user.username[0]) ||
    (user.email && user.email[0]) ||
    "A";

  const navigate = useNavigate();
  const location = useLocation();

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checking, setChecking] = useState(true);

  const isPatient =
    user &&
    typeof user.role === "string" &&
    user.role.toUpperCase() === "PATIENT";

  const onOnboardingPage = location.pathname.startsWith("/patient/onboarding");
  const onPatientArea = location.pathname.startsWith("/patient");

  // Top search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    appointments: [],
    messages: [],
    tests: [],
  });
  const [searchTouched, setSearchTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isPatient) {
        setNeedsOnboarding(false);
        setChecking(false);
        return;
      }

      try {
        const me = await patientService.meOrNull();
        if (cancelled) return;

        const missingCore =
          !me ||
          !me.firstName ||
          !me.lastName ||
          !me.dateOfBirth ||
          !me.phoneNumber ||
          !me.gender;

        setNeedsOnboarding(missingCore);
      } catch {
        if (!cancelled) {
          setNeedsOnboarding(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isPatient, location.pathname]);

  // Search behavior: small debounce + single backend call
  useEffect(() => {
    let cancelled = false;

    const term = searchQuery.trim();
    if (!term) {
      setSearchResults({ appointments: [], messages: [], tests: [] });
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const handle = setTimeout(async () => {
      try {
        const result = await searchService.searchAll(term);
        if (!cancelled) {
          setSearchResults(result);
        }
      } catch {
        if (!cancelled) {
          setSearchResults({ appointments: [], messages: [], tests: [] });
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const displayName =
    (user.username && user.username.replace(/_/g, " ")) ||
    (user.email && user.email.split("@")[0]) ||
    "Patient";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Patient";

  const idSource = user?.patientId || user?.id;
  const patientDisplayId = idSource
    ? String(idSource).slice(-6).padStart(6, "0")
    : null;

  const hasAnyResults =
    searchResults.appointments.length ||
    searchResults.messages.length ||
    searchResults.tests.length;

  const showDropdown =
    searchTouched &&
    searchQuery.trim().length > 0 &&
    (searchLoading || hasAnyResults || !hasAnyResults);

  function handleSearchChange(e) {
    setSearchTouched(true);
    setSearchQuery(e.target.value);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Escape") {
      handleClearSearch();
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchTouched(false);
    setSearchResults({ appointments: [], messages: [], tests: [] });
    setSearchLoading(false);
  }

  function handleResultClick(type, item) {
    if (type === "appointment") {
      navigate("/patient/appointments");
    } else if (type === "message") {
      navigate("/patient/messages");
    } else if (type === "test") {
      navigate("/patient/test-results");
    }

    handleClearSearch();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/70 backdrop-blur-md backdrop-saturate-150">
      {/* Main bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3 sm:gap-4">
        {/* Left: mobile menu + search */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation"
              className="inline-flex md:hidden items-center justify-center rounded-full p-2 -ml-1 text-gray-600 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/80 focus:ring-offset-1 focus:ring-offset-sky-50 transition"
            >
              <FiMenu className="text-[18px]" />
            </button>
          )}

          <div className="relative flex-1 min-w-0">
            <label className="search-pill max-w-[640px] w-full shadow-[0_0_0_1px_rgba(15,23,42,0.03)]">
              <FiSearch className="text-gray-400" />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="search-input"
                placeholder="Search appointments, messages, test results..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <FiX className="text-[14px]" />
                </button>
              )}
            </label>

            {/* Search dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-lg border border-gray-200/70 overflow-hidden text-sm">
                {/* Loading state */}
                {searchLoading && (
                  <div className="px-4 py-3 text-xs text-gray-500">
                    Searching your appointments, messages, and test results…
                  </div>
                )}

                {/* Results */}
                {!searchLoading && hasAnyResults && (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.appointments.length > 0 && (
                      <div className="border-b border-gray-100">
                        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.16em] text-gray-400 uppercase">
                          Appointments
                        </p>
                        {searchResults.appointments.map((appt) => (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() =>
                              handleResultClick("appointment", appt)
                            }
                            className="w-full px-4 py-2 flex flex-col items-start text-left hover:bg-sky-50/70 transition"
                          >
                            <span className="text-[13px] font-medium text-gray-900 truncate w-full">
                              {appt.title || "Appointment"}
                            </span>
                            <span className="mt-0.5 text-[11px] text-gray-500 truncate w-full">
                              {[
                                appt.clinicianName,
                                appt.specialty,
                                appt.date,
                                appt.time,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.messages.length > 0 && (
                      <div className="border-b border-gray-100">
                        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.16em] text-gray-400 uppercase">
                          Messages
                        </p>
                        {searchResults.messages.map((thread) => (
                          <button
                            key={thread.id}
                            type="button"
                            onClick={() => handleResultClick("message", thread)}
                            className="w-full px-4 py-2 flex flex-col items-start text-left hover:bg-sky-50/70 transition"
                          >
                            <span className="text-[13px] font-medium text-gray-900 truncate w-full">
                              {thread.subject ||
                                thread.title ||
                                "Message thread"}
                            </span>
                            <span className="mt-0.5 text-[11px] text-gray-500 truncate w-full">
                              {thread.lastMessageText ||
                                thread.preview ||
                                "Conversation with your care team"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.tests.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.16em] text-gray-400 uppercase">
                          Test results
                        </p>
                        {searchResults.tests.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleResultClick("test", r)}
                            className="w-full px-4 py-2 flex flex-col items-start text-left hover:bg-sky-50/70 transition"
                          >
                            <span className="text-[13px] font-medium text-gray-900 truncate w-full">
                              {r.name || r.title || r.testName || "Lab result"}
                            </span>
                            <span className="mt-0.5 text-[11px] text-gray-500 truncate w-full">
                              {r.status ? r.status : "Result"}{" "}
                              {r.takenAt || r.date || r.createdAt
                                ? "· recent"
                                : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Beautiful empty state when there are no matches */}
                {!searchLoading && !hasAnyResults && (
                  <div className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                        <FiSearch className="text-[16px]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          No matches found
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          We could not find any appointments, messages, or test
                          results for{" "}
                          <span className="font-medium text-gray-900">
                            “{searchQuery.trim()}”
                          </span>
                          .
                        </p>
                        <ul className="mt-2 text-xs text-gray-500 list-disc list-inside space-y-0.5">
                          <li>Try a shorter keyword or a different term.</li>
                          <li>Check the spelling of names or test names.</li>
                        </ul>
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="mt-3 inline-flex items-center text-xs font-medium text-sky-700 hover:text-sky-800"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/80 focus:ring-offset-1 focus:ring-offset-sky-50 transition"
          >
            <FiBell className="text-[18px] text-gray-600" />
            <span className="absolute right-2 top-2 block w-2 h-2 rounded-full bg-rose-500" />
          </button>

          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-gray-900">
              {displayName}
            </span>
            <span className="text-xs text-gray-500">
              {roleLabel}
              {patientDisplayId ? ` · ID ${patientDisplayId}` : ""}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 grid place-items-center text-white font-semibold shadow-sm"
            title={user?.username || user?.email || "User"}
          >
            {String(initial).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Onboarding reminder banner */}
      {isPatient &&
        onPatientArea &&
        !onOnboardingPage &&
        !checking &&
        needsOnboarding && (
          <div className="border-t border-amber-200 bg-amber-50/95">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-amber-900">
                Your profile is not complete yet. Please finish onboarding so
                your care team has the right information.
              </p>
              <button
                type="button"
                onClick={() => navigate("/patient/onboarding")}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-amber-50 transition"
              >
                Complete profile
              </button>
            </div>
          </div>
        )}
    </header>
  );
}

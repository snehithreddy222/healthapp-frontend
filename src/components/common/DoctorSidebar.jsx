// src/components/common/DoctorSidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiMessageSquare,
  FiDroplet,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { authService } from "../../services/authService";

const DoctorItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      [
        "group relative block w-full rounded-xl px-3 py-2 transition-colors",
        isActive
          ? "bg-white/85 text-sky-900 shadow-sm"
          : "text-slate-700 hover:bg-white/70",
      ].join(" ")
    }
  >
    {({ isActive }) => (
      <>
        {/* Left accent bar on active */}
        <div
          className={[
            "pointer-events-none absolute inset-y-1 left-1 rounded-full transition-all duration-200",
            "w-1",
            isActive
              ? "opacity-100 bg-gradient-to-b from-sky-400 to-cyan-500 shadow-[0_0_8px_rgba(56,189,248,0.45)]"
              : "opacity-0",
          ].join(" ")}
        />

        <div className="relative flex items-center gap-3">
          <div
            className={[
              "w-8 h-8 rounded-xl grid place-items-center text-[18px] shrink-0 transition-all duration-200",
              isActive
                ? "bg-sky-100 text-sky-700"
                : "bg-white/60 text-sky-600 group-hover:bg-white/90",
            ].join(" ")}
          >
            <Icon />
          </div>
          <span className="text-[15px] font-medium truncate">
            {label}
          </span>
        </div>
      </>
    )}
  </NavLink>
);

export default function DoctorSidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const openLogout = () => setShowLogoutConfirm(true);
  const closeLogout = () => setShowLogoutConfirm(false);

  const handleLogoutConfirmed = () => {
    authService.logout();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  return (
    <>
      <aside className="shell-sidebar relative overflow-hidden">
        {/* Soft gradient background for doctor view */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-sky-100 to-slate-50" />

        {/* Content layer */}
        <div className="relative flex h-full flex-col text-slate-800">
          {/* Brand */}
          <div className="sb-head">
            <div className="w-8 h-8 rounded-2xl bg-white grid place-items-center mr-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
              <div className="w-3.5 h-3.5 rounded-lg bg-gradient-to-br from-sky-500 via-cyan-400 to-indigo-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-semibold tracking-tight text-slate-900">
                HealthApp
              </span>
              <span className="text-[11px] text-slate-500">
                Care team workspace.
              </span>
            </div>
          </div>

          {/* Section label */}
          <p className="mt-4 px-4 text-[11px] font-semibold tracking-[0.12em] text-slate-500">
            DOCTOR VIEW
          </p>

          {/* Main nav: make it scrollable for shorter screens */}
          <nav className="mt-2 flex-1 overflow-y-auto pr-1 space-y-1">
            <DoctorItem
              to="/doctor/dashboard"
              icon={FiGrid}
              label="Dashboard"
            />
            <DoctorItem
              to="/doctor/schedule"
              icon={FiCalendar}
              label="Today’s schedule"
            />
            <DoctorItem
              to="/doctor/patients"
              icon={FiUsers}
              label="My patients"
            />
            <DoctorItem
              to="/doctor/messages"
              icon={FiMessageSquare}
              label="Inbox"
            />
            <DoctorItem
              to="/doctor/test-results"
              icon={FiDroplet}
              label="Lab reviews"
            />
          </nav>

          {/* Footer actions */}
          <div className="px-3 pb-4 pt-3 border-t border-slate-200/70 space-y-2">
            <DoctorItem
              to="/doctor/settings"
              icon={FiSettings}
              label="Account settings"
            />

            <button
              type="button"
              onClick={openLogout}
              className="w-full inline-flex items-center gap-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50/90 font-medium transition-colors"
            >
              <div className="w-8 h-8 rounded-xl grid place-items-center bg-rose-50 text-rose-500 text-[18px] shrink-0">
                <FiLogOut />
              </div>
              <span className="truncate">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/35 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Sign out of the doctor portal?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You will be logged out on this device. You can sign in again at
              any time to manage your patients and schedule.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeLogout}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirmed}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

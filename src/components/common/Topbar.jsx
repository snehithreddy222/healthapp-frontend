// src/components/common/Topbar.jsx
import React from "react";
import { FiSearch, FiBell } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function Topbar() {
  // prefer context; fall back to localStorage so it never crashes
  const { user: ctxUser } = useAuth();
  const user = ctxUser || authService.getCurrentUser() || {};
  const initial =
    (user.username && user.username[0]) ||
    (user.email && user.email[0]) ||
    "A";

  return (
    <header className="h-16 bg-white border-b border-gray-200/60">
      <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Search (one single bar across the app) */}
        <label className="search-pill flex-1 max-w-[520px]">
          <FiSearch className="text-gray-400" />
          <input
            className="search-input"
            placeholder="Search records, messages..."
          />
        </label>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 hover:bg-gray-100"
          >
            <FiBell className="text-[18px]" />
            {/* example unread dot */}
            <span className="absolute right-2 top-2 block w-2 h-2 rounded-full bg-rose-500" />
          </button>

          <div
            className="w-9 h-9 rounded-full bg-sky-200 grid place-items-center text-sky-700 font-semibold"
            title={user?.username || user?.email || "User"}
          >
            {String(initial).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

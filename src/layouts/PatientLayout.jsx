// src/layouts/PatientLayout.jsx
import React, { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

export default function PatientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Desktop sidebar (same look as before) */}
      <aside className="hidden lg:block w-[244px] bg-white border-r border-gray-200">
        <Sidebar />
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar – shows hamburger on small screens */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content – your cards etc use main-inner padding */}
        <main className="main-inner">{children}</main>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="h-full w-72 max-w-[80%] bg-white shadow-2xl">
            <Sidebar />
          </div>
          <button
            type="button"
            className="flex-1 h-full bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        </div>
      )}
    </div>
  );
}

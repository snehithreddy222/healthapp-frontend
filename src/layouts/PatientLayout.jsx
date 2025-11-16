// src/layouts/PatientLayout.jsx
import React from "react";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

export default function PatientLayout({ children }) {
  return (
    <div className="shell">
      <Sidebar />

      <main className="shell-main">
        <div className="main-inner">
          {/* Top actions row (bell + avatar) */}
          <Topbar />

          {/* Page content */}
          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

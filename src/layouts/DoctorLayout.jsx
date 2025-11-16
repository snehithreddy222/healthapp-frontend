// src/layouts/DoctorLayout.jsx
import React from "react";
import Topbar from "../components/common/Topbar";
import DoctorSidebar from "../components/common/DoctorSidebar";

export default function DoctorLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Left sidebar */}
      <aside className="w-[244px] bg-white border-r border-gray-200 sticky top-0 h-screen">
        <DoctorSidebar />
      </aside>

      {/* Right pane: top bar + page content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="main-inner">
          {children}
        </main>
      </div>
    </div>
  );
}

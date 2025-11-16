// src/pages/patient/PatientAppointments.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import DateBadge from "../../components/common/DateBadge";
import SectionCard from "../../components/common/SectionCard";
import { appointmentService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingList, setUpcomingList] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        appointmentService.listUpcoming(),
        appointmentService.listPast(),
      ]);
      setUpcomingList(u);
      setPast(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // reload whenever the user changes (e.g., after login)
    if (user?.token) load();
  }, [user?.token, load]);

  const onCancel = async (id) => {
    await appointmentService.cancel(id);
    await load(); // refresh list immediately
  };

  return (
    <div className="min-h-full">
      <div className="appbar bg-transparent border-0 h-auto">
        <div className="appbar-inner px-0 max-w-none">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
                Your Appointments
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your upcoming and past appointments.
              </p>
            </div>
            <button
              onClick={() => navigate("/patient/appointments/new")}
              className="btn-primary inline-flex items-center gap-2 px-4 h-10 rounded-md"
            >
              <FiPlus className="text-[18px]" />
              Schedule New Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1040px] mt-6 space-y-6">
        <SectionCard title="Upcoming Appointments">
          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-gray-500">
              Loading...
            </div>
          ) : upcomingList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-gray-500">
              No upcoming appointments.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
              {upcomingList.map((a) => (
                <div key={a.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DateBadge mon={appointmentService.toBadge(a.date).mon} day={appointmentService.toBadge(a.date).day} />
                      <div>
                        <div className="font-semibold text-gray-900">{a.title}</div>
                        <div className="text-gray-600 text-sm mt-0.5">
                          {a.time} with {a.clinicianName} ({a.specialty})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() =>
                          navigate("/patient/appointments/new", { state: { mode: "reschedule", appointmentId: a.id } })
                        }
                        className="text-sky-700 font-medium hover:underline"
                      >
                        Reschedule
                      </button>
                      <button onClick={() => onCancel(a.id)} className="text-rose-600 font-medium hover:underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Past Appointments">
          {past.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-gray-500">
              No past appointments.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
              {past.map((a) => (
                <div key={a.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DateBadge mon={appointmentService.toBadge(a.date).mon} day={appointmentService.toBadge(a.date).day} />
                      <div>
                        <div className="font-semibold text-gray-900">{a.title}</div>
                        <div className="text-gray-600 text-sm mt-0.5">
                          {a.time} with {a.clinicianName} ({a.specialty})
                        </div>
                      </div>
                    </div>
                    <button className="text-sky-700 font-medium hover:underline">View Visit Summary</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

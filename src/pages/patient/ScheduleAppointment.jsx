// src/pages/patient/ScheduleAppointment.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { appointmentService } from "../../services/appointmentService";
import { doctorService } from "../../services/doctorService";

export default function ScheduleAppointment() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const isReschedule = state?.mode === "reschedule";
  const rescheduleId = state?.appointmentId || null;

  const [clinicians, setClinicians] = useState([]);
  const [form, setForm] = useState({
    clinicianId: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
  });
  const [slots, setSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedClinician = useMemo(
    () => clinicians.find((c) => c.id === form.clinicianId),
    [clinicians, form.clinicianId]
  );

  // Load clinicians and (if rescheduling) the original appointment
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [docs, existing] = await Promise.all([
          doctorService.list(),
          isReschedule && rescheduleId ? appointmentService.getById(rescheduleId) : null,
        ]);
        if (!mounted) return;
        setClinicians(docs);

        if (existing) {
          setForm({
            clinicianId: existing.clinicianId,
            date: existing.date,
            time: existing.time,
            reason: existing.title || "",
            notes: existing.notes || "",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isReschedule, rescheduleId]);

  // Load availability each time clinician/date changes
  useEffect(() => {
    if (!form.date || !form.clinicianId) {
      setSlots([]);
      return;
    }
    let mounted = true;
    (async () => {
      const s = await appointmentService.getAvailability(form.date, form.clinicianId);
      if (mounted) setSlots(s);
    })();
    return () => {
      mounted = false;
    };
  }, [form.date, form.clinicianId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.clinicianId || !form.date || !form.time || !form.reason) {
      alert("Please select a clinician, date, time, and enter a reason.");
      return;
    }
    try {
      setSubmitting(true);
      if (isReschedule && rescheduleId) {
        await appointmentService.update(rescheduleId, {
          clinicianId: form.clinicianId,
          date: form.date,
          time: form.time,
          reason: form.reason,
          notes: form.notes,
        });
      } else {
        await appointmentService.create(form);
      }
      navigate("/patient/appointments");
    } catch (err) {
      alert(err.message || "Failed to submit appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[720px] px-2 sm:px-4 py-6">
      <h1 className="text-[24px] font-bold text-gray-900">
        {isReschedule ? "Reschedule Appointment" : "Schedule a New Appointment"}
      </h1>
      <p className="text-gray-600 mt-1">
        Choose a clinician, pick a date & time, and add a short reason.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Clinician */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Clinician</label>
          <select
            name="clinicianId"
            value={form.clinicianId}
            onChange={onChange}
            className="input mt-1 w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
            required
            disabled={loading}
          >
            <option value="">{loading ? "Loading…" : "Select a clinician…"}</option>
            {clinicians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.specialization ? `• ${c.specialization}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              className="input mt-1 w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
              min={appointmentService.todayISO()}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <select
              name="time"
              value={form.time}
              onChange={onChange}
              className="input mt-1 w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
              required
              disabled={!form.date || !form.clinicianId || loading}
            >
              <option value="">
                {!form.date || !form.clinicianId ? "Select date & clinician first" : "Select a time…"}
              </option>
              {slots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <input
            type="text"
            name="reason"
            value={form.reason}
            onChange={onChange}
            placeholder="Annual Physical Exam, Follow-up, etc."
            className="input mt-1 w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
            required
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            rows={4}
            className="input mt-1 w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
            placeholder="Any extra context for the clinician…"
            disabled={loading}
          />
        </div>

        {/* Summary */}
        {selectedClinician && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{selectedClinician.name}</span>
              {selectedClinician.specialization ? ` • ${selectedClinician.specialization}` : ""}
              <br />
              {form.date && form.time ? (
                <>
                  Scheduled for{" "}
                  <span className="font-medium text-gray-900">
                    {form.date} @ {form.time}
                  </span>
                </>
              ) : (
                "Pick a date & time"
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || loading}
            className="btn-primary h-11 px-5 rounded-md disabled:opacity-60"
          >
            {submitting ? (isReschedule ? "Rescheduling..." : "Scheduling...") : (isReschedule ? "Confirm Reschedule" : "Schedule Appointment")}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ml-3 inline-flex items-center h-11 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

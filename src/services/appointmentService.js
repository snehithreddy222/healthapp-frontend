// src/services/appointmentService.js
import http from "./http";
import { authService } from "./authService";

function toBadgeFromDate(dateISO) {
  const d = new Date(dateISO);
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  return { mon, day };
}

function mapServerAppointment(a) {
  const d = new Date(a.dateTime);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    id: a.id,
    dateTime: d, // keep Date for filtering
    date: d.toISOString().slice(0, 10),
    time,
    clinicianId: a.doctorId,
    clinicianName: a?.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : "",
    specialty: a?.doctor?.specialization || "",
    location: a?.location || "",
    title: a?.reason || "Visit",
    status: a?.status,
  };
}

function isFuture(dt) {
  const now = new Date();
  return dt.getTime() >= now.getTime();
}

export const appointmentService = {
  async listUpcoming() {
    await this.ensureLoggedIn();
    // Pull everything for the patient, then filter strictly on UI.
    const { data } = await http.get("/appointments/mine");
    const list = Array.isArray(data?.data) ? data.data.map(mapServerAppointment) : [];

    // Only future + SCHEDULED
    const filtered = list.filter((a) => a.status === "SCHEDULED" && isFuture(a.dateTime));

    // Sort by soonest first
    filtered.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    return filtered;
  },

  async listPast() {
    await this.ensureLoggedIn();
    const { data } = await http.get("/appointments/mine");
    const list = Array.isArray(data?.data) ? data.data.map(mapServerAppointment) : [];

    // Only COMPLETED (exclude CANCELLED)
    const filtered = list.filter((a) => a.status === "COMPLETED");

    // Newest first
    filtered.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    return filtered;
  },

  async create({ clinicianId, date, time, reason, notes }) {
    await this.ensureLoggedIn();
    const u = authService.getCurrentUser();
    if (!u?.patientId) throw new Error("No patient profile linked to this user");

    const [hh, mm] = time.split(":");
    const iso = new Date(`${date}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`).toISOString();

    const { data } = await http.post("/appointments", {
      patientId: u.patientId,
      doctorId: clinicianId,
      dateTime: iso,
      reason,
      notes,
    });
    return mapServerAppointment(data?.data);
  },

  async cancel(id) {
    await this.ensureLoggedIn();
    await http.patch(`/appointments/${id}/cancel`);
    return true;
  },

  async getClinicians() {
    try {
      const { data } = await http.get("/doctors", { params: { limit: 50 } });
      if (data?.success) {
        return data.data.doctors.map((d) => ({
          id: d.id,
          name: `Dr. ${d.firstName} ${d.lastName}`,
          specialty: d.specialization,
          location: d.location || "",
        }));
      }
    } catch {
      /* ignore, fallback below */
    }
    return [{ id: "doc_0001", name: "Dr. Evelyn Reed", specialty: "Cardiology", location: "Main Hospital" }];
  },

  toBadge(dateISO) {
    return toBadgeFromDate(dateISO);
  },

  async ensureLoggedIn() {
    const u = authService.getCurrentUser();
    if (!u?.token) throw new Error("Not authenticated");
  },
};

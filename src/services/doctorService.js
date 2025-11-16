// src/services/doctorService.js
import http from "./http";

/**
 * Doctors service
 * GET /api/doctors
 */
export const doctorService = {
  async list({ search, limit = 50, page = 1 } = {}) {
    const params = { limit, page };
    if (search) params.search = search;

    const res = await http.get("/doctors", { params });

    // Support both shapes: {success, data:{doctors:[]}} or {success, data:[]} or []
    const payload = res?.data;
    const list =
      Array.isArray(payload?.data?.doctors) ? payload.data.doctors :
      Array.isArray(payload?.data)         ? payload.data :
      Array.isArray(payload)               ? payload      : [];

    return list.map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      name: d.name || `Dr. ${[d.firstName, d.lastName].filter(Boolean).join(" ")}`,
      specialization: d.specialization || "",
      phoneNumber: d.phoneNumber || "",
      yearsExperience: d.yearsExperience ?? null,
      location: d.location || "",
    }));
  },
};

// src/services/doctorService.js
import http from "./http";

function mapDoctorSummary(d) {
  if (!d) return null;
  const first = d.firstName || "";
  const last = d.lastName || "";
  const name =
    first || last ? `Dr. ${[first, last].filter(Boolean).join(" ")}` : "Doctor";
  return {
    id: d.id,
    name,
    firstName: d.firstName || "",
    lastName: d.lastName || "",
    specialization: d.specialization || "",
    licenseNumber: d.licenseNumber || "",
    phoneNumber: d.phoneNumber || "",
    yearsExperience: d.yearsExperience ?? null,
  };
}

export const doctorService = {
  // Used for patient flows (doctor dropdown etc)
  async list() {
    const res = await http.get("/doctors");
    const raw =
      Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

    return raw
      .map(mapDoctorSummary)
      .filter(Boolean)
      .map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialization,
      }));
  },

  // Fetch current doctor profile or null if not created yet
  async meOrNull() {
    try {
      const res = await http.get("/doctors/me");
      const doc = res?.data?.data || res?.data || null;
      return doc ? mapDoctorSummary(doc) : null;
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) return null;
      throw e;
    }
  },

  // Create or update doctor profile during onboarding
  async onboard(payload) {
    const res = await http.post("/doctors/onboard", payload);
    const doc = res?.data?.data || res?.data || null;
    return mapDoctorSummary(doc);
  },

  isProfileComplete(doc) {
    if (!doc) return false;
    const required = [
      doc.firstName,
      doc.lastName,
      doc.specialization,
      doc.licenseNumber,
      doc.phoneNumber,
    ];
    return required.every((v) => typeof v === "string" && v.trim().length > 0);
  },
};

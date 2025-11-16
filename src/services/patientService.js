// src/services/patientService.js
import http from "./http";
import { authService } from "./authService";

export const patientService = {
  /**
   * Return the current patient's profile.
   * Tries /patients/me first; falls back to token-stored patientId or /auth/profile.
   */
  async me() {
    // Preferred: backend route /api/patients/me (if available)
    try {
      const res = await http.get("/patients/me");
      if (res?.data?.success) return res.data.data;
      if (res?.data?.id) return res.data; // in case backend returns raw patient
    } catch (_) {
      // swallow and try fallbacks
    }

    // Fallback 1: use patientId stored with the logged-in user
    const u = authService.getCurrentUser?.();
    if (u?.patientId) {
      const r = await http.get(`/patients/${u.patientId}`);
      return r?.data?.data || r?.data || null;
    }

    // Fallback 2: just return auth profile (at least gives name/email)
    const prof = await http.get("/auth/profile");
    return prof?.data?.data || prof?.data || null;
  },

  /**
   * Update own patient profile.
   */
  async updateSelf(id, payload) {
    const res = await http.put(`/patients/${id}`, payload);
    return res?.data?.data || res?.data || res;
  },
};

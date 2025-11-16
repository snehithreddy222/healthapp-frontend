// src/services/authService.js
import http, { API_BASE } from "./http";

const USER_KEY = "user";

export const authService = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async login({ username, password }) {
    const { data } = await http.post("/auth/login", { username, password });
    if (data?.success && data?.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.data));
    }
    return data;
  },

  async fetchProfile() {
    const { data } = await http.get("/auth/profile");
    return data?.data;
  },

  logout() {
    localStorage.removeItem(USER_KEY);
  },
};

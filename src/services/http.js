// src/services/http.js
import axios from "axios";

export const API_BASE = "http://localhost:3000/api";

// Central axios instance
const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach Authorization: Bearer <token> automatically if present
http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.token) {
        config.headers.Authorization = `Bearer ${u.token}`;
      }
    }
  } catch {
    /* ignore */
  }
  // We do NOT need cookies for this API; use tokens.
  config.withCredentials = false;
  return config;
});

export default http;

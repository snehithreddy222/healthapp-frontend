// src/services/http.js
import axios from "axios";

// Read base URL from Vite env.
// Important: no localhost fallback here.
// You control the URL via VITE_API_BASE_URL in .env / .env.production.
const rawBase = import.meta.env.VITE_API_BASE_URL || "";
const baseURL = rawBase.replace(/\/+$/, ""); // trim trailing slash if any

if (!baseURL) {
  // This warning is for dev only, to remind you to set VITE_API_BASE_URL.
  console.warn("[HTTP] VITE_API_BASE_URL is not set. Requests will likely fail.");
}

export const API_BASE = baseURL;

const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT from localStorage "user" object (your existing pattern)
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
    // ignore parse errors, send request without token
  }
  config.withCredentials = false;
  return config;
});

// Optional response logging (keeps behavior same otherwise)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[HTTP ERROR]", {
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    throw err;
  }
);

export default http;

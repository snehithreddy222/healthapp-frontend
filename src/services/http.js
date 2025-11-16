
import axios from "axios";

export const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3000/api";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.token) config.headers.Authorization = `Bearer ${u.token}`;
    }
  } catch {}
  config.withCredentials = false;
  return config;
});

export default http;

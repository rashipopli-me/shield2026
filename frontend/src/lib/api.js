import axios from "axios";

// In dev, Vite proxies /api to the backend (see vite.config.js).
// In production, the backend serves the built frontend itself, so /api
// is same-origin and this needs no configuration.
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shield_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiErrorMessage(err) {
  return err?.response?.data?.message || "Something went wrong. Please try again.";
}

export default api;

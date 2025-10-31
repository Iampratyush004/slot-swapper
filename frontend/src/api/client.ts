import axios from "axios";

const baseURL = (import.meta as any).env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const fallback = { message: "Request failed" };
    const data = err?.response?.data ?? fallback;
    const normalized = new Error((data.error && (data.error.message || data.error)) || data.message || fallback.message);
    // Attach original for debugging if needed
    (normalized as any).original = err;
    return Promise.reject(normalized);
  }
);



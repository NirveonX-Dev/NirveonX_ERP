import axios from "axios";

// In dev, Vite proxies nothing - we call the API server directly via this base URL.
// In production, set VITE_API_URL to your deployed Render backend URL.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nx_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      // Blocked or expired session - force back to login
      if (err.response?.data?.error?.toLowerCase().includes("block")) {
        localStorage.removeItem("nx_token");
        localStorage.removeItem("nx_user");
        window.location.href = "/login?blocked=1";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

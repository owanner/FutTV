import axios from "axios";

/**
 * Axios instance for the Fut-TV backend API.
 * Uses VITE_API_URL env var in development, falls back to production URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://fut-tv-api.onrender.com",
  timeout: 30000
});

export default api;

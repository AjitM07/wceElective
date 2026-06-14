import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor to add authorization token and selected program header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const savedProgram = localStorage.getItem("selectedProgram");
    if (savedProgram) {
      try {
        const program = JSON.parse(savedProgram);
        config.headers["X-Selected-Program"] = program;
      } catch (e) {
        config.headers["X-Selected-Program"] = savedProgram;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

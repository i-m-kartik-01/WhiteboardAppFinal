import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5003/api",
  withCredentials: true, // REQUIRED for refreshToken cookie
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const res = await api.post("/users/refreshToken");
        localStorage.setItem("accessToken", res.data.accessToken);
        error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(error.config);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

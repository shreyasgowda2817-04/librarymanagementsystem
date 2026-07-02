import axios from "axios";
import { API_URL } from "../config";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});


// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or unauthorized
      localStorage.removeItem("user");
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default api;

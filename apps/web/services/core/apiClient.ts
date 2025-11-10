import { Config } from "@/config/config";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: Config.APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    if (status === 401) {
      localStorage.removeItem("session_token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

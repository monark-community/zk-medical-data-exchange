import { Config } from "@/config/config";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: Config.APP_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": Config.APP_API_KEY,
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

// Add response interceptor to handle errors consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // Re-throw the error to maintain existing error handling
    return Promise.reject(error);
  }
);

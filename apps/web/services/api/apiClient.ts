import { API_KEY } from "@/config/apiKey";
import { API_BASE_URL } from "@/config/apiUrl";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Custom API key
    "x-api-key": API_KEY,
  },
});

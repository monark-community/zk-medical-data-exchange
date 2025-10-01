import { Config } from "@/config/config";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: Config.APP_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": Config.APP_API_KEY,
  },
});

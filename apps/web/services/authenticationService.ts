import { apiClient } from "./apiClient";

export const createToken = async (wallet_address: string) => {
  const response = await apiClient.post("/auth/create-sesion", wallet_address);
  return response.data.token;
};
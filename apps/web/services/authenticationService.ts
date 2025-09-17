import { apiClient } from "./apiClient";

export const requestNonce = async (wallet_address: string) => {
  const response = await apiClient.post("/auth/nonce", wallet_address);
  return response.data;
};
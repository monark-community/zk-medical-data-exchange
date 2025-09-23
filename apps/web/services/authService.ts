import { apiClient } from "./apiClient";

export const requestNonce = async (walletAddress: string) => {
  const response = await apiClient.post("/auth/nonce", { walletAddress });
  return response.data;
};

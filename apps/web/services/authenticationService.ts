import { apiClient } from "./apiClient";

export const createToken = async (walletAddress: string) => {
  console.log(walletAddress);
  const response = await apiClient.post("/auth/create-session", { walletAddress });
  console.log(response);
  return response.data.token;
};
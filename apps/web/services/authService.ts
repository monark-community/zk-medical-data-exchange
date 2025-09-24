import { apiClient } from "./apiClient";

export const requestNonce = async (walletAddress: string) => {
  const response = await apiClient.post("/auth/nonce", { walletAddress });
  return response.data;
};

export const verifySignature = async (walletAddress: string, signature: string, message: string) => {
  const response = await apiClient.post("/auth/verify", { 
    walletAddress, 
    signature, 
    message 
  });
  return response.data;
};

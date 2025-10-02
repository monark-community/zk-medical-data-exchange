import { apiClient } from "./core/apiClient";

const TOKEN_KEY = 'cura_auth_token';
const TOKEN_EXPIRY_KEY = 'cura_auth_expiry';

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

export const logout = async () => {
  const token = getAuthToken();
  
  if (token) {
    try {
      await apiClient.post("/auth/logout", {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
  }
  
  clearAuthToken();
};

export const setAuthToken = (token: string, expiresIn: number) => {
  if (typeof window === 'undefined') return;
  
  const expiryTime = Date.now() + (expiresIn * 1000);
  
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return null;
  }
  
  if (Date.now() > parseInt(expiry)) {
    clearAuthToken();
    return null;
  }
  
  return token;
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

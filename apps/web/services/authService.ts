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
      // Call logout endpoint with authentication
      await apiClient.post("/auth/logout", {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    }
  }
  
  // Clear local session data
  clearAuthToken();
};

/**
 * Store JWT token and expiration time in localStorage
 */
export const setAuthToken = (token: string, expiresIn: number) => {
  if (typeof window === 'undefined') return;
  
  const expiryTime = Date.now() + (expiresIn * 1000); // Convert seconds to milliseconds
  
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

/**
 * Get JWT token from localStorage if it's not expired
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return null;
  }
  
  // Check if token is expired
  if (Date.now() > parseInt(expiry)) {
    clearAuthToken();
    return null;
  }
  
  return token;
};

/**
 * Clear JWT token and expiration time from localStorage
 */
export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Check if user has a valid authentication session
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

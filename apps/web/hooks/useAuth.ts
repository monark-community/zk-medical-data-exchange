"use client";

import { useWeb3AuthConnect, useWeb3Auth, useIdentityToken } from "@web3auth/modal/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { Config } from "@/config/config";
import axios from "axios";

export function useAuthRedirect() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();

  useEffect(() => {
    console.log("[Auth] useAuthRedirect - Connection status:", isConnected);
    
    if (isConnected) {
      console.log("[Auth] User is connected, redirecting to dashboard...");
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return { isConnected };
}

export function useProtectedRoute() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();

  useEffect(() => {
    console.log("[Auth] useProtectedRoute - Connection status:", isConnected);
    
    if (!isConnected) {
      console.log("[Auth] User not connected, redirecting to home...");
      router.push('/');
    } else {
      console.log("[Auth] User is connected, route is protected");
    }
  }, [isConnected, router]);

  return { isConnected };
}

export function useWeb3AuthLogin() {
  const { isConnected } = useWeb3AuthConnect();
  const { web3Auth } = useWeb3Auth();
  const { getIdentityToken } = useIdentityToken();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

const login = useCallback(async () => {
  try {
    console.log("[Auth] Starting Web3Auth login flow...");
    setIsAuthenticating(true);
    setError(null);

    await web3Auth!.connect();
    console.log("[Auth] ✓ Web3Auth connection successful");

    const idToken = await getIdentityToken();
    
    // DECODE THE TOKEN TO SEE ITS CONTENTS
    if (idToken) {
      const tokenParts = idToken.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("[Auth] Token payload:", {
        aud: payload.aud,
        iss: payload.iss,
        sub: payload.sub,
        exp: payload.exp,
        wallets: payload.wallets
      });
    }
    
    if (!idToken) {
      throw new Error("Failed to retrieve authentication token");
    }
      
      const response = await axios.post(`${Config.APP_API_URL}/auth/verify`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      }); 

      console.log("[Auth] Backend response status:", response.status);

      const data = response.data;
      console.log("[Auth] ✓ Backend verification successful", {
        userId: data.userId,
        walletAddress: data.walletAddress,
        email: data.email,
      });
      
      // Store session token
      if (data.sessionToken) {
        console.log("[Auth] Step 4: Storing session data in localStorage...");
        localStorage.setItem('session_token', data.sessionToken);
        localStorage.setItem('wallet_address', data.walletAddress);
        localStorage.setItem('user_id', data.userId);
        console.log("[Auth] ✓ Session data stored successfully");
      }

      // Redirect to dashboard
      console.log("[Auth] Step 5: Redirecting to dashboard...");
      router.push('/dashboard');
      console.log("[Auth] ✓ Authentication flow completed successfully!");
      
    } catch (err) {
      console.error("[Auth] ✗ Authentication error:", err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }, [web3Auth, getIdentityToken, router]);

  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Starting logout...");
      
      if (web3Auth) {
        console.log("[Auth] Logging out from Web3Auth...");
        await web3Auth.logout();
        console.log("[Auth] ✓ Web3Auth logout successful");
      }
      
      console.log("[Auth] Clearing localStorage...");
      localStorage.removeItem('session_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');
      console.log("[Auth] ✓ localStorage cleared");
      
      console.log("[Auth] Redirecting to home...");
      router.push('/');
      console.log("[Auth] ✓ Logout completed successfully!");
    } catch (err) {
      console.error("[Auth] ✗ Logout error:", err);
    }
  }, [web3Auth, router]);

  return {
    login,
    logout,
    isConnected,
    isAuthenticating,
    error,
  };
}

export function useAuthToken() {
  const { getIdentityToken } = useIdentityToken();
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    try {
      console.log("[Auth] Retrieving authentication token...");
      
      // Use the getIdentityToken function from useIdentityToken hook
      const idToken = await getIdentityToken();
      
      if (!idToken) {
        console.error("[Auth] ✗ No token available");
        throw new Error("No authentication token available");
      }
      
      console.log("[Auth] ✓ Token retrieved (length: %d)", idToken.length);
      
      setToken(idToken);
      return idToken;
    } catch (err) {
      console.error("[Auth] ✗ Failed to get token:", err);
      return null;
    }
  }, [getIdentityToken]);

  return { token, getToken };
}
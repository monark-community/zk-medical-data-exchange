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
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return { isConnected };
}

export function useProtectedRoute() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
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
    setIsAuthenticating(true);
    setError(null);

    await web3Auth!.connect();

    const idToken = await getIdentityToken();
    
    if (!idToken) {
      throw new Error("Failed to retrieve authentication token");
    }
      
      const response = await axios.post(`${Config.APP_API_URL}/auth/verify`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      }); 

      const data = response.data;

      if (data.sessionToken) {
        localStorage.setItem('session_token', data.sessionToken);
        localStorage.setItem('wallet_address', data.walletAddress);
        localStorage.setItem('user_id', data.userId);
      }

      router.push('/dashboard');
      
    } catch (err) {
      console.error("[Auth] ✗ Authentication error:", err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }, [web3Auth, getIdentityToken, router]);

  const logout = useCallback(async () => {
    try {
      if (web3Auth) {
        await web3Auth.logout();
      }
      
      localStorage.removeItem('session_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');

      router.push('/');
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
      const idToken = await getIdentityToken();
      
      if (!idToken) {
        console.error("[Auth] ✗ No token available");
        throw new Error("No authentication token available");
      }
      
      setToken(idToken);
      return idToken;
    } catch (err) {
      console.error("[Auth] ✗ Failed to get token:", err);
      return null;
    }
  }, [getIdentityToken]);

  return { token, getToken };
}
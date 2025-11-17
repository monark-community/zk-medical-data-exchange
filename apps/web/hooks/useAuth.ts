"use client";

import { useWeb3AuthConnect, useWeb3Auth, useIdentityToken } from "@web3auth/modal/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { Config } from "@/config/config";
import { usePathname } from "next/navigation";
import axios from "axios";

function hasSessionTokens() {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("session_token");
  const walletAddress = localStorage.getItem("wallet_address");
  return token && walletAddress;
}

function deleteCredentials() {
  localStorage.removeItem("session_token");
  localStorage.removeItem("wallet_address");
}

export function useAuthRedirect() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ["/", "/research", "/breakthroughs", "/how-it-works"];
    const isPublicPage = publicPaths.includes(pathname);

    if ((!isConnected || !hasSessionTokens()) && !isPublicPage) {
      deleteCredentials();
      router.push("/");
      return;
    }

    if (isConnected && hasSessionTokens() && isPublicPage) {
      router.push("/dashboard");
    }
  }, [isConnected, router, pathname]);

  return { isConnected: isConnected && hasSessionTokens() };
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

      const response = await axios.post(
        `${Config.APP_API_URL}/auth/verify`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = response.data;

      if (data.sessionToken) {
        localStorage.setItem("session_token", data.sessionToken);
        localStorage.setItem("wallet_address", data.walletAddress);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("[Auth] Authentication error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  }, [web3Auth, getIdentityToken, router]);

  const logout = useCallback(async () => {
    try {
      if (web3Auth) {
        await web3Auth.logout();
      }
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    } finally {
      deleteCredentials();
      router.push("/");
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
        console.error("[Auth] No token available");
        throw new Error("No authentication token available");
      }

      setToken(idToken);
      return idToken;
    } catch (err) {
      console.error("[Auth] Failed to get token:", err);
      return null;
    }
  }, [getIdentityToken]);

  return { token, getToken };
}

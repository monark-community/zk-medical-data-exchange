"use client";

import { Web3Auth } from "@web3auth/single-factor-auth";
import { useWeb3AuthConnect, useWeb3Auth, useIdentityToken } from "@web3auth/modal/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { Config } from "@/config/config";
import { IBaseProvider } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

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
  const { connect, isConnected } = useWeb3AuthConnect();
  const { web3Auth } = useWeb3Auth();
  const { getIdentityToken, token } = useIdentityToken();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = useCallback(async () => {
    try {
      console.log("[Auth] Starting Web3Auth login flow...");
      setIsAuthenticating(true);
      setError(null);

      // Step 1: Connect with Web3Auth (handles OAuth and wallet creation)
      console.log("[Auth] Step 1: Connecting to Web3Auth...");
      const provider = await web3Auth!.connect();
      console.log("[Auth] ✓ Web3Auth connection successful");

      // Step 2: Get the JWT token from Web3Auth
      if (!web3Auth) {
        console.error("[Auth] ✗ Web3Auth instance not found");
        throw new Error("Web3Auth not initialized");
      }

      console.log("[Auth] Step 2: Retrieving JWT token from Web3Auth...");
      
      // Get the idToken from Web3Auth
      // The authenticateUser method returns the user info with idToken
      let idToken = "";
      
      try {
        // Try to get idToken using the provider
        const userInfo = await web3Auth.getUserInfo();
        console.log("[Auth] User info obtained:", userInfo);

        getIdentityToken();
        console.log(token);

        // const authentication = await provider!.useIdentityToken();

        // For Web3Auth Modal, we need to get the idToken from the session
        // This is stored in the provider after authentication
        if ((web3Auth as any).sessionManager?.sessionId) {
          idToken = (web3Auth as any).sessionManager.sessionId;
        } else if ((web3Auth as any).provider) {
          // Try to get it from the provider
          const provider = (web3Auth as any).provider;
          if (provider.request) {
            try {
              // Request the idToken from the provider
              const result = await provider.request({
                method: "private_key",
              });
              console.log("[Auth] Provider result:", result);
            } catch {
              console.log("[Auth] Could not get private_key from provider");
            }
          }
        }
        
        // If we still don't have an idToken, try getUserInfo which should have it
        if (!idToken && (userInfo as any).idToken) {
          idToken = (userInfo as any).idToken;
        }
      } catch (error) {
        console.error("[Auth] Error getting token:", error);
      }
      
      console.log("[Auth] JWT token retrieved:");
      console.log("  - Token length:", idToken.length);
      console.log("  - Token preview:", idToken ? idToken.substring(0, 50) + "..." : "EMPTY");
      console.log("  - Full token:", idToken);
      
      if (!idToken) {
        console.error("[Auth] ✗ Failed to retrieve idToken from Web3Auth");
        throw new Error("Failed to retrieve authentication token");
      }
      
      // Step 3: Send token to backend for verification
      console.log("[Auth] Step 3: Sending token to backend for verification...");
      console.log("[Auth] Backend URL:", `${Config.APP_API_URL}/api/auth/verify`);
      
      const response = await fetch(`${Config.APP_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      console.log("[Auth] Backend response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Auth] ✗ Backend verification failed:", errorData);
        throw new Error(errorData.error || 'Authentication failed on backend');
      }

      const data = await response.json();
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
  }, [connect, web3Auth, router]);

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
  const { web3Auth } = useWeb3Auth();
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    try {
      console.log("[Auth] Retrieving authentication token...");
      
      if (!web3Auth) {
        console.error("[Auth] ✗ Web3Auth not initialized");
        throw new Error("Web3Auth not initialized");
      }

      // Get the idToken from Web3Auth
      let idToken = "";
      const userInfo = await web3Auth.getUserInfo();
      
      if ((userInfo as any).idToken) {
        idToken = (userInfo as any).idToken;
      } else if ((web3Auth as any).sessionManager?.sessionId) {
        idToken = (web3Auth as any).sessionManager.sessionId;
      }
      
      console.log("[Auth] ✓ Token retrieved (length: %d)", idToken.length);
      
      setToken(idToken);
      return idToken;
    } catch (err) {
      console.error("[Auth] ✗ Failed to get token:", err);
      return null;
    }
  }, [web3Auth]);

  return { token, getToken };
}
"use client";

import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/services/authService";

export function useAuthRedirect() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has valid JWT session
    setHasSession(isAuthenticated());
  }, []);

  useEffect(() => {
    // Redirect to dashboard if connected and has valid session
    if (isConnected && hasSession) {
      router.push('/dashboard');
    }
  }, [isConnected, hasSession, router]);

  return { isConnected, hasSession };
}

export function useProtectedRoute() {
  const { isConnected } = useWeb3AuthConnect();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has valid JWT session
    const authenticated = isAuthenticated();
    setHasSession(authenticated);
    
    // Redirect to home if not connected or no valid session
    if (!isConnected || !authenticated) {
      router.push('/');
    }
  }, [isConnected, router]);

  return { isConnected, hasSession };
}
"use client";

import React, { useState, useEffect } from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAuthRedirect } from "@/hooks/useAuth";
import { createToken } from "@/services/authenticationService";
import { useAccount } from "wagmi";

export default function LandingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);

  const { isConnected } = useAuthRedirect();
  const { connect } = useWeb3AuthConnect();
  const { address, isConnected: isWalletConnected } = useAccount();

  useEffect(() => {
    const handleTokenCreation = async () => {
      if (isWalletConnected && address && !token && !isCreatingToken) {
        setIsCreatingToken(true);
        try {
          const newToken = await createToken(address);
          setToken(newToken);
          localStorage.setItem('sb_token', newToken);
        } catch (error) {
          console.error("Failed to create token:", error);
        } finally {
          setIsCreatingToken(false);
        }
      }
    };

    handleTokenCreation();
  }, [isWalletConnected, address, token, isCreatingToken]);

  const handleWalletConnection = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect user:", error);
    }
  };

  if (isConnected) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg"
        onClick={handleWalletConnection}
      >
        Connect Wallet
      </button>
    </div>
  );
}
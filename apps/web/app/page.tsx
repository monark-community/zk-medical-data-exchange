"use client";

import React, { useState, useEffect } from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAuthRedirect } from "@/hooks/useAuth";
import { requestNonce } from "@/services/authService";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function LandingPage() {
  const { isConnected } = useAuthRedirect();
  const { connect } = useWeb3AuthConnect();
  const { address } = useAccount();
  const [shouldLogin, setShouldLogin] = useState(false);

  useEffect(() => {
    if (shouldLogin && address) {
      handleLogin(address);
      setShouldLogin(false);
    }
  }, [address, shouldLogin]);

  const handleLogin = async (userAddress: string) => {
    try {
      const { nonce, message } = await requestNonce(userAddress);

      const web3authProvider = await connect();
      const provider = new ethers.BrowserProvider(web3authProvider!);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      console.log("User signed message:", signature);

    } catch (err) {
      console.log("Failed to login user:", err);
    }
  };

  const handleConnectionAttempt = async () => {
    await connect();
    setShouldLogin(true);
  };

  if (isConnected) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg"
        onClick={handleConnectionAttempt}
      >
        Connect Wallet
      </button>
    </div>
  );
}
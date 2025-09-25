"use client";

import React, { useState } from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { requestNonce, verifySignature } from "@/services/authService";
import { BrowserProvider } from "ethers";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { connect } = useWeb3AuthConnect();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnectionAttempt = async () => {
    try {
      setIsAuthenticating(true);
      
      const web3authProvider = await connect();

      if (!web3authProvider) { throw new Error("MetaMask not found"); }

      const provider = new BrowserProvider(web3authProvider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const { message } = await requestNonce(userAddress);
      const signature = await signer.signMessage(message);
      const res = await verifySignature(userAddress, signature, message);

      if (res.success) {
        router.push('/dashboard');
      } else {
        throw new Error("Invalid signature");
      }
    } catch (err) {
      console.log("Authentication failed:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg disabled:opacity-50 cursor-pointer"
        onClick={handleConnectionAttempt}
        disabled={isAuthenticating}
      >
        Connect Wallet
      </button>
    </div>
  );
}
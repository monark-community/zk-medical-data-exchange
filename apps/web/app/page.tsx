"use client";

import React from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAuthRedirect } from "@/hooks/useAuth";

export default function LandingPage() {
  const { isConnected } = useAuthRedirect();
  const { connect } = useWeb3AuthConnect();

  if (isConnected) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg"
        onClick={() => connect()}
      >
        Connect Wallet
      </button>
    </div>
  );
}
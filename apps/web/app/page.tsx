"use client";

import React from "react";
import { useAuthRedirect, useWeb3AuthLogin } from "@/hooks/useAuth";
import CustomNavbar from "@/components/navigation/customNavBar";

export default function LandingPage() {
  const { isConnected } = useAuthRedirect();
  const { login, isAuthenticating, error } = useWeb3AuthLogin();

  if (isConnected) {
    return null;
  }

  return (
    <>
      <CustomNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold mb-4">Cura</h1>
        <p className="text-gray-600 mb-8">A ZK-Powered Medical Data Exchange</p>
        
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          onClick={login}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? "Connecting..." : "Login with Web3Auth"}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Authentication Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
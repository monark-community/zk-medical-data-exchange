"use client";

import { useProtectedRoute } from "@/hooks/useAuth";

import CustomNavbar from "@/components/navigation/customNavBar";
import DashboardTabs from "./components/dashboardTabs";

import { useAccount } from "wagmi";

import AccountOverview from "./components/accountOverview";
import { generateAESKey } from "@/utils/encryption";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { addAESKeyToStore, getAESKey } from "@/services/storage";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const account = useAccount();
  const [aesKey, setAESKey] = useState<string | null>(null);

  useEffect(() => {
    const initKey = async () => {
      if (!account.address) {
        console.log("No wallet address available yet");
        return;
      }

      try {
        const existingKey = getAESKey(account.address);
        if (existingKey) {
          console.log("Using existing AES key from cache");
          setAESKey(existingKey);
          return;
        }

        // If no valid key, derive a new one
        console.log("Deriving new AES key for address:", account.address);
        const key = generateAESKey(await deriveKeyFromWallet());
        setAESKey(key);
        addAESKeyToStore(key, account.address); // ✅ Include wallet address!
      } catch (err) {
        console.error("Failed to derive AES key:", err);
      }
    };
    initKey();
  }, [account.address]); // ✅ Re-run when wallet address changes

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />

      <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-8">
        <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="title mb-8">
            <p className="text-3xl font-bold text-gray-900 mb-2">Your Health Data Dashboard</p>
            <p className="text-gray-600">Manage your data contributions and track rewards</p>
          </div>
          <div className="summarySection ">
            <AccountOverview />
          </div>
          <div className="tabSection ">
            <DashboardTabs aesKey={aesKey} account={account} />
          </div>
        </div>
      </main>
    </div>
  );
}

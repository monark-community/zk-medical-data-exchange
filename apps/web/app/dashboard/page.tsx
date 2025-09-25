"use client";

import { useEffect, useState } from "react";
import { addAESKeyToStore, getAESKey } from "@/services/aesKeyStore";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { generateAESKey } from "@/utils/encryption";
import { useProtectedRoute } from "@/hooks/useAuth";

import CustomNavbar from "@/components/navigation/customNavBar";
import { useAccount } from "wagmi";
import UploadSection from "@/components/uploadSection";
import FilesSection from "@/components/filesSection";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const account = useAccount();
  const [aesKey, setAESKey] = useState<string | null>(null);

  useEffect(() => {
    const initKey = async () => {
      try {
        const key = getAESKey() || generateAESKey(await deriveKeyFromWallet());
        setAESKey(key);
        addAESKeyToStore(key);
      } catch (err) {
        console.error("Failed to derive AES key:", err);
      }
    };
    initKey();
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <FilesSection aesKey={aesKey} walletAddress={account.address} />
        <UploadSection account={account} aesKey={aesKey} />
      </main>
    </div>
  );
}

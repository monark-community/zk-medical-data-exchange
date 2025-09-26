"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addAESKeyToStore } from "@/services/aesKeyStore";
import { ipfsDownload } from "@/services/ipfsService";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { decryptWithKey, encryptWithKey, generateAESKey } from "@/utils/encryption";
import { useProtectedRoute } from "@/hooks/useAuth";

import CustomNavbar from "@/components/navigation/customNavBar";
import { useAccount } from "wagmi";
import UploadSection from "@/components/uploadSection";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const account = useAccount();
  const [aesKey, setAESKey] = useState<string | null>(null);
  const [ipfsContent, setIpfsContent] = useState<string | null>(null);

  useEffect(() => {
    const initKey = async () => {
      try {
        const key = generateAESKey(await deriveKeyFromWallet());
        setAESKey(key);
        addAESKeyToStore(key);
      } catch (err) {
        console.error("Failed to derive AES key:", err);
      }
    };
    initKey();
  }, []);

  const handleDownload = async () => {
    if (!aesKey) return;
    try {
      const content = await ipfsDownload("");
      const encrypted = encryptWithKey(content, aesKey);
      const decrypted = decryptWithKey(encrypted, aesKey);
      setIpfsContent(decrypted);
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      setIpfsContent("Failed to load content.");
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <div className="flex flex-col gap-4">
          <Button onClick={handleDownload} disabled={!aesKey}>
            Load IPFS Content
          </Button>
        </div>
        <UploadSection account={account} aesKey={aesKey} />
        {ipfsContent && (
          <div className="mt-4 p-4 border rounded bg-gray-50 w-full max-w-lg">
            <pre>{ipfsContent}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

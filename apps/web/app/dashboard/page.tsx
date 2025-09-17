"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ipfsDownload } from "@/services/ipfsService";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { decryptWithKey, encryptWithKey, generateAESKey } from "@/utils/encryption";
import { uploadMedicalData } from "@/services/dataVaultService";

export default function Dashboard() {
  const [aesKey, setAesKey] = useState<string | null>(null);
  const [ipfsContent, setIpfsContent] = useState<string | null>(null);
  const cid = "bafkreig4456mrnmpmqr56d4mrmkb43clx5r4iu6woblwwglkixqupiwkoe";

  // Derive wallet key on app start
  useEffect(() => {
    const initKey = async () => {
      try {
        const key = generateAESKey(await deriveKeyFromWallet());
        setAesKey(key);
        console.log("Derived AES Key:", key);
      } catch (err) {
        console.error("Failed to derive AES key:", err);
      }
    };
    initKey();
  }, []);

  const handleDownload = async () => {
    if (!aesKey) return;
    try {
      const content = await ipfsDownload(cid);
      const encrypted = encryptWithKey(content, aesKey);
      const decrypted = decryptWithKey(encrypted, aesKey);
      setIpfsContent(decrypted);
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      setIpfsContent("Failed to load content.");
    }
  };

  const handleUploadMedicalData = async () => {
    try {
      await uploadMedicalData("0xYourWalletAddress", "exampleEncryptedCID", "medical");
      alert("Medical data uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload medical data:", error);
      alert("Failed to upload medical data.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10">
      <Button onClick={handleDownload} disabled={!aesKey}>
        Load IPFS Content
      </Button>
      <Button onClick={handleUploadMedicalData}>Upload medical data</Button>
      {ipfsContent && (
        <div className="mt-4 p-4 border rounded bg-gray-50 w-full max-w-lg">
          <pre>{ipfsContent}</pre>
        </div>
      )}
    </main>
  );
}
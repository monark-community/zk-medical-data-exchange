"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ipfsDownload } from "@/services/ipfsService";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { decryptWithKey, encryptWithKey } from "@/utils/encryption";

export default function Home() {
  const [aesKey, setAesKey] = useState<string | null>(null);
  const [ipfsContent, setIpfsContent] = useState<string | null>(null);
  const cid = "bafkreig4456mrnmpmqr56d4mrmkb43clx5r4iu6woblwwglkixqupiwkoe";

  // Derive wallet key on app start
  useEffect(() => {
    const initKey = async () => {
      try {
        const key = (await deriveKeyFromWallet()).toString("hex");
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
      // Since the content for testing is currently not encrypted on IPFS,
      // we simulate the encryption/decryption process here.
      // In a real scenario, the content on IPFS would be encrypted.
      const content = await ipfsDownload(cid);
      const encrypted = encryptWithKey(content, aesKey);
      const decrypted = decryptWithKey(encrypted, aesKey);
      setIpfsContent(decrypted);
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      setIpfsContent("Failed to load content.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">CURA</h1>

      <Button onClick={handleDownload} disabled={!aesKey}>
        Load IPFS Content
      </Button>

      {ipfsContent && (
        <div className="mt-4 p-4 border rounded bg-gray-50 w-full max-w-lg">
          <pre>{ipfsContent}</pre>
        </div>
      )}

      <p className="mt-4 text-lg">This is a simple Next.js application...</p>
    </main>
  );
}

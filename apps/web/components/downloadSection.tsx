"use client";

import { useEffect, useState } from "react";
import { fetchCIDs } from "@/services/dataVaultService";
import { Button } from "./ui/button";
import { ipfsDownload } from "@/services/ipfsService";
import { decryptWithKey, encryptWithKey } from "@/utils/encryption";
import { DataVault } from "@/constants/dataVault";

export default function DownloadSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<DataVault[]>([]);
  const [ipfsContent, setIpfsContent] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      try {
        const data = await fetchCIDs(walletAddress);
        console.log(data);
        setMedicalData(data);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      }
    };

    fetchData();
  }, [walletAddress]);

  const handleDownload = async (index: number, cid: string) => {
    if (!aesKey) return;
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      const content = await ipfsDownload(decryptedCid);
      const encrypted = encryptWithKey(content, aesKey);
      const decrypted = decryptWithKey(encrypted, aesKey);
      setIpfsContent(decrypted);
      setActiveIndex(index);
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      setIpfsContent("Failed to load content.");
      setActiveIndex(index);
    }
  };

  if (!walletAddress) return <div>No wallet connected</div>;

  return (
    <div className="w-full">
      {medicalData.length === 0 ? (
        <div>No medical data found for this wallet.</div>
      ) : (
        <div className="w-full">
          <h2 className="text-lg font-semibold mb-4">Available Medical Data:</h2>

          {/* GRID CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicalData.map((data, index) => (
              <div
                key={index}
                className="p-6 border rounded shadow bg-white flex flex-col justify-between"
              >
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    <strong>CID:</strong> {data.encrypted_cid}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {data.resource_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Uploaded:</strong> {new Date(data.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDownload(index, data.encrypted_cid)}
                  disabled={!aesKey}
                >
                  View Content
                </Button>

                {activeIndex === index && ipfsContent && (
                  <div className="mt-4 p-4 border rounded bg-gray-50 overflow-auto max-h-64">
                    <pre className="whitespace-pre-wrap text-sm">{ipfsContent}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

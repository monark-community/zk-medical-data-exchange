"use client";

import { useEffect, useState } from "react";
import { fetchCIDs } from "@/services/api/dataVaultService";
import { Button } from "@/components/ui/button";
import { ipfsDownload } from "@/services/storage";
import { decryptWithKey } from "@/utils/encryption";
import { MedicalData } from "@/interfaces/medicalData";

export default function FilesSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      try {
        const data = await fetchCIDs(walletAddress);
        setMedicalData(data);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      }
    };

    fetchData();
  }, [walletAddress]);

  const getFileContent = async (cid: string) => {
    if (!aesKey) return;
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      const content = await ipfsDownload(decryptedCid);
      const decryptedContent = decryptWithKey(content, aesKey);
      return decryptedContent;
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      alert("Failed to load content.");
    }
  };

  const downloadContent = async (cid: string) => {
    const decrypted = await getFileContent(cid);
    if (!decrypted) return;

    const blob = new Blob([decrypted], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medical_data_${cid}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayContent = async (cid: string) => {
    const decrypted = await getFileContent(cid);
    if (!decrypted) return;

    const blob = new Blob([decrypted], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  if (!walletAddress) return <div>No wallet connected</div>;

  return (
    <div className="w-full">
      {medicalData.length === 0 ? (
        <div>No medical data found for this wallet.</div>
      ) : (
        <div className="w-full">
          <h2 className="text-lg font-semibold mb-4">Available Medical Data:</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicalData.map((data, index) => (
              <div
                key={index}
                className="p-6 border rounded shadow bg-white flex flex-col justify-between space-y-2"
              >
                <div className="mb-2">
                  <p className="text-sm text-gray-600 break-all">
                    <strong>CID:</strong> {data.encryptedCid}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {data.resourceType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Uploaded:</strong> {new Date(data.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button onClick={() => displayContent(data.encryptedCid)} disabled={!aesKey}>
                  View Content
                </Button>
                <Button onClick={() => downloadContent(data.encryptedCid)} disabled={!aesKey}>
                  Download Content
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

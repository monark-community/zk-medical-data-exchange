"use client";

import { useEffect, useState } from "react";
import { fetchCIDs } from "@/services/api/dataVaultService";
import { Button } from "@/components/ui/button";
import { ipfsDownload } from "@/services/api/ipfsService";
import { decryptWithKey } from "@/utils/encryption";
import { MedicalData } from "@/interfaces/medicalData";
import { logFileAccess } from "@/services/api/auditService";

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
      console.log("heyyyy");
      const decryptedContent = decryptWithKey(content, aesKey);
      return decryptedContent;
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      alert("Failed to load content.");
    }
  };

  const downloadContent = async (cid: string, resourceType: string) => {
    if (!walletAddress) return;

    let success = false;
    let fileSize = 0;

    try {
      const decrypted = await getFileContent(cid);
      if (!decrypted) return;

      const blob = new Blob([decrypted], { type: "text/plain" });
      fileSize = blob.size;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical_data_${cid}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success = true;
    } catch (error) {
      console.error("Failed to download content:", error);
      success = false;
    } finally {
      // Log the file access audit record
      try {
        await logFileAccess(
          walletAddress,
          cid, // encrypted CID
          "download",
          success,
          resourceType,
          {
            fileSize,
            mimeType: "application/json",
          }
        );
      } catch (auditError) {
        console.error("Failed to log file download audit:", auditError);
        // Don't prevent the download if audit logging fails
      }
    }
  };

  const displayContent = async (cid: string, resourceType: string) => {
    if (!walletAddress) return;

    let success = false;
    let fileSize = 0;

    try {
      const decrypted = await getFileContent(cid);
      if (!decrypted) return;

      const blob = new Blob([decrypted], { type: "text/plain" });
      fileSize = blob.size;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      success = true;
    } catch (error) {
      console.error("Failed to view content:", error);
      success = false;
    } finally {
      // Log the file access audit record
      try {
        await logFileAccess(
          walletAddress,
          cid, // encrypted CID
          "view",
          success,
          resourceType,
          {
            fileSize,
            mimeType: "application/json",
            viewMethod: "browser_tab",
          }
        );
      } catch (auditError) {
        console.error("Failed to log file view audit:", auditError);
        // Don't prevent the view if audit logging fails
      }
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
                <Button
                  onClick={() => displayContent(data.encryptedCid, data.resourceType)}
                  disabled={!aesKey}
                >
                  View Content
                </Button>
                <Button
                  onClick={() => downloadContent(data.encryptedCid, data.resourceType)}
                  disabled={!aesKey}
                >
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

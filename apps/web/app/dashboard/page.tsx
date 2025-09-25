"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addAESKeyToStore } from "@/services/aesKeyStore";
import { ipfsDownload, ipfsUpload } from "@/services/ipfsService";
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

  const onRecordTypeChange = (value: FhirResourceTypes) => {
    if (compliance?.resourceType !== value) {
      alert("Selected record type does not match file compliance. Please re-upload.");
      return;
    }
    setRecordType(value);
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
        {uploadedFileName && (
          <div className="flex items-center gap-2 mt-2">
            <span>{uploadedFileName}</span>
            {checking ? (
              <span>⏳</span>
            ) : isCompliant === true ? (
              <span>FHIR ✔️</span>
            ) : isCompliant === false ? (
              <span>❌</span>
            ) : null}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
              onClick={() => {
                setUploadedFileName(null);
                setUploadedFile(null);
                setIsCompliant(null);
                setReadyToSend(false);
              }}
            >
              Remove
            </button>
            {readyToSend && (
              <>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  onClick={async () => {
                    if (account.status !== "connected") return;
                    if (!aesKey || !uploadedFile) return;
                    const content = await uploadedFile.text();
                    const encryptedContent = encryptWithKey(content, aesKey);
                    const cid = await ipfsUpload(encryptedContent);
                    const encryptedCid = encryptWithKey(cid, aesKey);
                    const result = await uploadMedicalData(
                      account.address,
                      encryptedCid,
                      recordType
                    );

                    if (result) {
                      alert("Medical data uploaded successfully.");
                    }

                    setUploadedFileName(null);
                    setUploadedFile(null);
                    setIsCompliant(null);
                    setReadyToSend(false);
                  }}
                >
                  Confirm Send
                </button>
                <RecordTypeSelect onValueChange={onRecordTypeChange} selectedValue={recordType} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

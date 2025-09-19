"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addAESKeyToStore } from "@/services/aesKeyStore";
import { ipfsDownload, ipfsUpload } from "@/services/ipfsService";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { decryptWithKey, encryptWithKey, generateAESKey } from "@/utils/encryption";
import { uploadMedicalData } from "@/services/dataVaultService";
import { useAuthRedirect, useProtectedRoute } from "@/hooks/useAuth";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { checkFhirCompliance } from "@/utils/fhir";
import { RecordType } from "@/constants/recordTypes";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const { disconnect } = useWeb3AuthDisconnect();
  const account = useAccount();
  const [aesKey, setAESKey] = useState<string | null>(null);
  const [ipfsContent, setIpfsContent] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [isCompliant, setIsCompliant] = useState<boolean | null>(null);
  const [readyToSend, setReadyToSend] = useState(false);
  const cid = "bafkreig4456mrnmpmqr56d4mrmkb43clx5r4iu6woblwwglkixqupiwkoe";

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
    if (account.status === "connected") {
      if (!aesKey) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.click();

      try {
        const fileSelected = await new Promise<boolean>((resolve) => {
          input.onchange = () => resolve(!!input.files && input.files.length > 0);
        });

        if (!fileSelected || !input.files) return;
        const file = input.files[0];
        setUploadedFileName(file.name);
        setUploadedFile(file);
        setChecking(true);
        const compliant = await checkFhirCompliance(file);
        setIsCompliant(compliant);
        setChecking(false);
        setReadyToSend(compliant);

        if (!compliant) {
          //TODO: Implement user feedback for non-compliant files
        }

        console.log("Uploading file:", file.name);

      } catch (error) {
        console.error("Failed to upload medical data:", error);
        alert("Failed to upload medical data.");
      }
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Cura Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {account.status === "connected" ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'No wallet connected'}
              </span>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <div className="flex flex-col gap-4">
          <Button onClick={handleDownload} disabled={!aesKey}>
            Load IPFS Content
          </Button>
          <Button onClick={handleUploadMedicalData}>Upload medical data</Button>
        </div>
        
        {ipfsContent && (
          <div className="mt-4 p-4 border rounded bg-gray-50 w-full max-w-lg">
            <pre>{ipfsContent}</pre>
          </div>
        )}
        {uploadedFileName && (
          <div className="flex items-center gap-2 mt-2">
            <span>{uploadedFileName}</span>
            {checking ? <span>⏳</span> : isCompliant === true ? <span>FHIR ✔️</span> : isCompliant === false ? <span>❌</span> : null}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
              onClick={() => {
                setUploadedFileName(null);
                setUploadedFile(null);
                setIsCompliant(null);
                setReadyToSend(false);
              }}
            >Remove</button>
            {readyToSend && (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                onClick={async () => {
                  if (account.status !== "connected") return;
                  if (!aesKey || !uploadedFile) return;
                  const content = await uploadedFile.text();
                  const encryptedContent = encryptWithKey(content, aesKey);
                  const cid = await ipfsUpload(encryptedContent);
                  const encryptedCid = encryptWithKey(cid, aesKey);
                  const result = await uploadMedicalData(account.address, encryptedCid, RecordType.MEDICAL);

                  if (result) {
                    alert("Medical data uploaded successfully.");
                  }
          
                  setUploadedFileName(null);
                  setUploadedFile(null);
                  setIsCompliant(null);
                  setReadyToSend(false);
                }}
              >Confirm Send</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
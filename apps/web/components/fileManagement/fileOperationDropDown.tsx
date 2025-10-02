"use client";
import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EllipsisVertical } from "lucide-react";

import { decryptWithKey } from "@/utils/encryption";

import { MedicalData } from "@/interfaces/medicalData";
import { ipfsDelete, ipfsDownload } from "@/services/storage";
import { deleteCID } from "@/services/api";
const FileOperationDropDown = ({
  walletAddress,
  aesKey,
  setMedicalData,
  data,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
  setMedicalData: Dispatch<SetStateAction<MedicalData[]>>;
  data: MedicalData;
}) => {
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
    const decryptedContent = await getFileContent(cid);
    if (!decryptedContent) return;

    const blob = new Blob([decryptedContent], { type: "text/plain" });
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

  const deleteContent = async (cid: string) => {
    if (!aesKey || !walletAddress) return;
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      await ipfsDelete(decryptedCid);
      await deleteCID(walletAddress!, cid);
      alert("File deleted successfully.");
      setMedicalData((prev) => prev.filter((item) => item.encryptedCid !== cid));
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      alert("Failed to load content.");
      // TODO: Add better UI feedback
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-bold">File Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => displayContent(data.encryptedCid)} disabled={!aesKey}>
            View Content
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadContent(data.encryptedCid)} disabled={!aesKey}>
            Download Content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteContent(data.encryptedCid)}
            disabled={!aesKey}
          >
            Delete Content
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FileOperationDropDown;

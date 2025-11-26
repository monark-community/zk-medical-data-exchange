"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
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
import { ipfsDelete } from "@/services/api/ipfsService";
import { ipfsDownload } from "@/services/api/ipfsService";
import { deleteCID } from "@/services/api";
import { logFileAccess } from "@/services/api/auditService";
import eventBus from "@/lib/eventBus";
import { Spinner } from "@/components/ui/spinner";
import { useTxStatusState } from "@/hooks/useTxStatus";
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
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileContent = async (cid: string) => {
    if (!aesKey) return;
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      const content = await ipfsDownload(decryptedCid);
      const decryptedContent = decryptWithKey(content, aesKey);
      return decryptedContent;
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      useTxStatusState.getState().showError("Failed to load content.");
    }
  };

  const downloadContent = async (cid: string) => {
    if (!walletAddress) return;

    let success = false;
    let fileSize = 0;

    try {
      const decryptedContent = await getFileContent(cid);
      if (!decryptedContent) return;

      const blob = new Blob([decryptedContent], { type: "text/plain" });
      fileSize = blob.size;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.resourceType}_${data.createdAt}.json`;
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
          data.resourceType,
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

  const displayContent = async (cid: string) => {
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
          data.resourceType,
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

  const deleteContent = async (cid: string, fileId: string) => {
    if (!aesKey || !walletAddress) return;
    setIsDeleting(true);
    eventBus.emit("medicalDataDeleting");
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      await ipfsDelete(decryptedCid, fileId);
      await deleteCID(walletAddress!, cid);
      useTxStatusState.getState().show("File deleted successfully.");
      setMedicalData((prev) => prev.filter((item) => item.encryptedCid !== cid));
      eventBus.emit("medicalDataDeleted");
    } catch (error) {
      console.error("Failed to delete file:", error);
      useTxStatusState.getState().showError("Failed to delete file.");
      eventBus.emit("medicalDataDeleted");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isDeleting}>
          {isDeleting ? <Spinner className="size-4 text-blue-600" /> : <EllipsisVertical />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-bold">File Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => displayContent(data.encryptedCid)}
            disabled={!aesKey || isDeleting}
          >
            View Content
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadContent(data.encryptedCid)}
            disabled={!aesKey || isDeleting}
          >
            Download Content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteContent(data.encryptedCid, data.fileId)}
            disabled={!aesKey || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Content"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FileOperationDropDown;

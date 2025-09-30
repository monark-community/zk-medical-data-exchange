"use client";
import { Database } from "lucide-react";

import FilesSection from "@/components/fileManagement/filesSection";
import { Config, UseAccountReturnType } from "wagmi";
import UploadSection from "@/components/fileManagement/uploadSection";
const DataVaultSection = ({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
  aesKey: string | null;
}) => {
  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="header space-y-1.5 p-6 flex flex-row items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center space-x-2">
            <Database /> <span>Your Data Vault</span>
          </h3>
          <UploadSection account={account} aesKey={aesKey} />
        </div>
        <FilesSection walletAddress={account.address} aesKey={aesKey} />
      </div>
    </div>
  );
};
export default DataVaultSection;

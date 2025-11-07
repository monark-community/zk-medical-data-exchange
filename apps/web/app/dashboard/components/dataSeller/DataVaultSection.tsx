"use client";
import { Database } from "lucide-react";

import FilesSection from "@/components/fileManagement/filesSection";
import { Config, UseAccountReturnType } from "wagmi";
import UploadSection from "@/components/fileManagement/uploadSection";
import DashboardSectionHeader from "@/app/dashboard/components/shared/DashboardSectionHeader";

const DataVaultSection = ({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
  aesKey: string | null;
}) => {
  return (
    <div className="w-full space-y-8">
      <DashboardSectionHeader
        icon={<Database className="h-8 w-8 text-white" />}
        title="Your Data Vault"
        description="Securely encrypted medical records stored in a distributed network"
        action={<UploadSection account={account} aesKey={aesKey} />}
      />

      {/* Files Content */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <FilesSection walletAddress={account.address} aesKey={aesKey} />
      </div>
    </div>
  );
};

export default DataVaultSection;

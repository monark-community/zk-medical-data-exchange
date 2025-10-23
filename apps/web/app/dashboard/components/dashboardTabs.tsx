"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataVaultSection from "./dataVaultSection";
import StudiesSection from "./StudiesSection";
import PrivacySection from "./PrivacySection";
import { Config, UseAccountReturnType } from "wagmi";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@/services/api/auditService";
const DashboardTabs = ({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
  aesKey: string | null;
}) => {
  const { currentProfile } = useProfile();

  return (
    <Tabs defaultValue="Overview" className="w-full">
      <TabsList className="w-full h-10">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {/* Only show Data Vault tab for Data Sellers */}
        {currentProfile === UserProfile.DATA_SELLER && (
          <TabsTrigger value="dataVault">Data Vault</TabsTrigger>
        )}
        <TabsTrigger value="studies">Studies</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"></TabsContent>
      {/* Only render Data Vault content for Data Sellers */}
      {currentProfile === UserProfile.DATA_SELLER && (
        <TabsContent value="dataVault">
          <DataVaultSection aesKey={aesKey} account={account} />
        </TabsContent>
      )}
      <TabsContent value="studies">
        {currentProfile === UserProfile.RESEARCHER ? (
          <StudiesSection />
        ) : (
          // TODO: [LT] Add studies for data seller component when ready
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-500">
              Studies section for data sellers is coming soon.
            </div>
          </div>
        )}
      </TabsContent>
      <TabsContent value="privacy">
        <PrivacySection />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;

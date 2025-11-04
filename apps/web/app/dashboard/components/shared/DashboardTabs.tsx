"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Config, UseAccountReturnType } from "wagmi";
import { useProfile } from "@/contexts/ProfileContext";
import DataSellerStudiesSection from "@/app/dashboard/components/dataSeller/DataSellerStudiesSection";
import PrivacySection from "@/app/dashboard/components/shared/PrivacySection";
import DataVaultSection from "@/app/dashboard/components/dataSeller/DataVaultSection";
import ResearcherStudiesSection from "@/app/dashboard/components/researcher/ResearcherStudiesSection";

import { UserProfile } from "@zk-medical/shared";

const DashboardTabs = ({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
  aesKey: string | null;
}) => {
  const { currentProfile } = useProfile();

  return (
    <Tabs defaultValue="overview" className="w-full">
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
          <ResearcherStudiesSection />
        ) : (
          <DataSellerStudiesSection />
        )}
      </TabsContent>
      <TabsContent value="privacy">
        <PrivacySection />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;

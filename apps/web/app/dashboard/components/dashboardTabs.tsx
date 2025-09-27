"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataVaultSection from "./dataVaultSection";
const DashboardTabs = ({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) => {
  return (
    <Tabs defaultValue="Overview" className="w-full">
      <TabsList className="w-full h-10">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="dataVault">Data Vault</TabsTrigger>
        <TabsTrigger value="studies">Studies</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"></TabsContent>
      <TabsContent value="dataVault">
        <DataVaultSection aesKey={aesKey} walletAddress={walletAddress} />
      </TabsContent>
      <TabsContent value="studies"></TabsContent>
      <TabsContent value="privacy"></TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;

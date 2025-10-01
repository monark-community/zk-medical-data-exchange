"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataVaultSection from "./dataVaultSection";
import StudiesSection from "./StudiesSection";
import { Config, UseAccountReturnType } from "wagmi";
const DashboardTabs = ({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
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
        <DataVaultSection aesKey={aesKey} account={account} />
      </TabsContent>
      <TabsContent value="studies">
        <StudiesSection />
      </TabsContent>
      <TabsContent value="privacy"></TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;

"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { useProfile } from "@/contexts/ProfileContext";

const GovernanceTabs = () => {
  //   const { currentProfile } = useProfile();

  return (
    <Tabs defaultValue="proposals" className="w-full">
      <TabsList className="w-full h-10">
        <TabsTrigger value="proposals">Proposals</TabsTrigger>
        <TabsTrigger value="myVotes">My Votes</TabsTrigger>
        <TabsTrigger value="createProposal">Create Proposal</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"></TabsContent>
      <TabsContent value="myVotes"></TabsContent>
      <TabsContent value="createProposal"></TabsContent>
    </Tabs>
  );
};

export default GovernanceTabs;

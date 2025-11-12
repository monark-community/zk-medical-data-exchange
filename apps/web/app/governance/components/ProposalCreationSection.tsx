"use client";
import { Gavel } from "lucide-react";
import CreateProposalDialog from "@/app/governance/components/CreateProposalDialog";

import emitter from "@/lib/eventBus";
import ProposalsSection from "./ProposalsSection";

const ProposalCreationSection = () => {
  const handleProposalCreated = () => {
    // TODO: Refresh proposals list or show notification
    console.log("Proposal created successfully");
    emitter.emit("proposalUpdated");
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center space-x-2">
            <Gavel className="h-6 w-6" /> <span>Create New Proposal</span>
          </h3>
        </div>
        <div className="flex flex-row">
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <Gavel className="h-16 w-16 text-gray-300" />
            <div className="text-center space-y-2">
              <h4 className="text-xl font-semibold">Proposal Creation</h4>
              <p className="text-muted-foreground">
                Create a new governance proposal to improve the Cura platform
              </p>
            </div>
            <CreateProposalDialog onProposalCreated={handleProposalCreated} />
          </div>

          <ProposalsSection variant="myProposals" showEnhancedHeader={true} />
        </div>
      </div>
    </div>
  );
};
export default ProposalCreationSection;

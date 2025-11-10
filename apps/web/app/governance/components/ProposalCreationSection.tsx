"use client";
import { useState } from "react";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProposal } from "@/services/api/governanceService";
import { CreateProposalParams } from "@/interfaces/proposal";
import { useAccount } from "wagmi";
import { Spinner } from "@/components/ui/spinner";

const ProposalCreationSection = () => {
  const [isWaitingForProposalCreation, setIsWaitingForProposalCreation] = useState(false);
  const { address: walletAddress } = useAccount();

  const handleCreateProposal = async () => {
    const proposal = {
      title: "Implement new privacy features",
      description: "This proposal aims to add enhanced privacy controls for users",
      category: 1,
      walletAddress: walletAddress,
    } as CreateProposalParams;

    setIsWaitingForProposalCreation(true);
    try {
      const result = await createProposal(proposal);
      if (result.success) {
        console.log("Proposal created successfully");
        // TODO: Show success message to user pourt dire que la proposal est bien faite
      } else {
        console.error("Failed to create proposal:", result.error);
        // TODO: handle le messge d'erreur pour l'user
      }
    } catch (error) {
      console.error("Unexpected error creating proposal:", error);
      // TODO: handle le messge d'erreur pour l'user
    } finally {
      setIsWaitingForProposalCreation(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center space-x-2">
            <Gavel className="h-6 w-6" /> <span>Create New Proposal</span>
          </h3>
        </div>
        <div className="p-12 flex flex-col items-center justify-center space-y-6">
          <Gavel className="h-16 w-16 text-gray-300" />
          <div className="text-center space-y-2">
            <h4 className="text-xl font-semibold">Proposal Creation</h4>
            <p className="text-muted-foreground">
              Create a new governance proposal to improve the Cura platform
            </p>
          </div>
          {isWaitingForProposalCreation ? (
            <Button className="bg-gradient-to-r from-blue-600 to-teal-600" size="lg">
              <Spinner className="size-12 text-blue-600" />
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-600 to-teal-600"
              onClick={handleCreateProposal}
              size="lg"
            >
              Create Proposal
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProposalCreationSection;

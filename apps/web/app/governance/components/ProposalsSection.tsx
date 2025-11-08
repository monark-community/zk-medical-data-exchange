"use client";

import { useAccount } from "wagmi";

import ProposalContainer from "./ProposalContainer";
import { useProposals } from "@/hooks/useProposal";
import ProposalsList from "./ProposalList";

export default function ProposalsSection() {
  const { address: walletAddress } = useAccount();
  const { proposals, isLoading, error, refetchProposals } = useProposals();

  const handleVoteToProposal = async (proposalId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    const proposal = proposals.find((p) => p.id === proposalId);

    const confirmMessage = `Do you want to vote on "${proposal?.title}"?`;

    if (window.confirm(confirmMessage)) {
      console.log(`Voting on proposal ${proposalId}: "${proposal?.title}"`);
      // TODO: Implement the actual vote logic here
      alert("Voting functionality coming soon!");
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <ProposalContainer
          isLoading={isLoading}
          error={error}
          proposals={proposals}
          onRetry={refetchProposals}
          emptyState={{
            title: "No proposals available",
            description: "There are currently no governance proposals available. Check back later!",
          }}
        >
          <ProposalsList
            proposals={proposals}
            renderActionButtons={(proposal) => (
              <button
                onClick={() => handleVoteToProposal(proposal.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Vote
              </button>
            )}
          />
        </ProposalContainer>
      </div>
    </div>
  );
}

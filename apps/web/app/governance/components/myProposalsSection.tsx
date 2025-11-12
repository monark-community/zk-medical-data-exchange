"use client";

import { useAccount } from "wagmi";
import { FileText, TrendingUp, Users } from "lucide-react";

import ProposalContainer from "./ProposalContainer";
import { useProposalsByWalletAddress } from "@/hooks/useProposal";
import ProposalsList from "./ProposalList";

export default function MyProposalsSection() {
  const { address: walletAddress } = useAccount();
  const { proposals, isLoading, error, refetchProposals } = useProposalsByWalletAddress();

  const handleVoteToProposal = async (proposalId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    const proposal = proposals.find((p) => p.id === proposalId);

    const confirmMessage = `Do you want to vote on "${proposal?.title}"?`;

    // TODO: Implement the actual vote logic here
  };

  // Calculate stats for proposals
  const totalVotes = proposals.reduce((acc, p) => acc + p.votesFor + p.votesAgainst, 0);
  const activeProposals = proposals.filter((p) => p.state === 1).length;

  return (
    <div id="proposal-tabs-section" className="w-full pb-12 pr-12">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg overflow-hidden">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-blue-600  to-teal-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Your Proposals</h3>
                <p className="text-blue-100 text-sm mt-1">
                  Manage and track your governance contributions
                </p>
              </div>
            </div>

            {/* Stats Pills */}
            {proposals.length > 0 && !isLoading && (
              <div className="hidden md:flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-xs text-blue-100">Total</div>
                      <div className="text-lg font-bold text-white">{proposals.length}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-xs text-blue-100">Active</div>
                      <div className="text-lg font-bold text-white">{activeProposals}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white" />
                    <div>
                      <div className="text-xs text-blue-100">Total Votes</div>
                      <div className="text-lg font-bold text-white">
                        {totalVotes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <ProposalContainer
          isLoading={isLoading}
          error={error}
          proposals={proposals}
          onRetry={refetchProposals}
          emptyState={{
            title: "You haven't created any proposals yet",
            description:
              "Start contributing to the governance of the platform by creating your first proposal!",
          }}
        >
          <ProposalsList
            proposals={proposals}
            renderActionButtons={(proposal) => (
              <button
                onClick={() => handleVoteToProposal(proposal.id)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
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

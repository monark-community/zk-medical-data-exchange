"use client";

import { FileText, TrendingUp, Users } from "lucide-react";

import ProposalContainer from "./ProposalContainer";
import { useProposals, useProposalsByWalletAddress } from "@/hooks/useProposal";
import ProposalsList from "./ProposalList";

interface ProposalsSectionProps {
  variant?: "all" | "myProposals" | "myVotes";
  showEnhancedHeader?: boolean;
}

export default function ProposalsSection({
  variant = "all",
  showEnhancedHeader = true,
}: ProposalsSectionProps) {
  // Use the appropriate hook based on variant
  const allProposalsData = useProposals();
  const myProposalsData = useProposalsByWalletAddress();

  let { proposals, isLoading, error, refetchProposals } =
    variant === "myProposals" ? myProposalsData : allProposalsData;

  if (variant === "myVotes") {
    proposals = proposals.filter((p) => p.hasVoted);
  }
  // Calculate stats for proposals (used when showEnhancedHeader is true)
  const totalVotes = proposals.reduce((acc, p) => acc + p.votesFor + p.votesAgainst, 0);
  const activeProposals = proposals.filter((p) => p.state === 0).length;

  // Determine empty state based on variant
  const emptyState =
    variant === "myProposals"
      ? {
          title: "You haven't created any proposals yet",
          description:
            "Start contributing to the governance of the platform by creating your first proposal!",
        }
      : variant === "myVotes"
      ? {
          title: "You haven't voted for any proposals yet",
          description:
            "Participate in governance by voting on active proposals to help shape the platform!",
        }
      : {
          title: "No proposals available",
          description: "There are currently no governance proposals available. Check back later!",
        };

  return (
    <div id="proposal-tabs-section" className={`w-full ${showEnhancedHeader ? "pb-12 pr-12" : ""}`}>
      <div
        className={
          showEnhancedHeader
            ? "rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg overflow-hidden"
            : "rounded-lg border bg-card text-card-foreground shadow-sm"
        }
      >
        {/* Enhanced Header Section - only shown when showEnhancedHeader is true */}
        {showEnhancedHeader && (
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {variant === "myProposals"
                      ? "Your Proposals"
                      : variant === "myVotes"
                      ? "Your Votes"
                      : "All Proposals"}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {variant === "myProposals"
                      ? "Manage and track your governance proposals"
                      : variant === "myVotes"
                      ? "View proposals you've voted on"
                      : "View and participate in governance proposals"}
                  </p>
                </div>
              </div>

              {/* Stats Pills */}
              {proposals.length > 0 && !isLoading && (
                <div className="hidden md:flex items-center gap-4">
                  {variant === "myProposals" ? (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-white" />
                          <div>
                            <div className="text-xs text-blue-100">Active Proposals</div>
                            <div className="text-lg font-bold text-white">{activeProposals}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <ProposalContainer
          isLoading={isLoading}
          error={error}
          proposals={proposals}
          onRetry={refetchProposals}
          emptyState={emptyState}
        >
          <ProposalsList proposals={proposals} />
        </ProposalContainer>
      </div>
    </div>
  );
}

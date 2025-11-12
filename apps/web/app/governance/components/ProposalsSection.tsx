"use client";

import ProposalContainer from "./ProposalContainer";
import { useProposals } from "@/hooks/useProposal";
import ProposalsList from "./ProposalList";

export default function ProposalsSection() {
  const { proposals, isLoading, error, refetchProposals } = useProposals();

  return (
    <div id="proposal-tabs-section" className="w-full ">
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
          <ProposalsList proposals={proposals} />
        </ProposalContainer>
      </div>
    </div>
  );
}

import { Proposal } from "@/interfaces/proposal";
import emitter from "@/lib/eventBus";
import { getProposals } from "@/services/api/governanceService";
import React from "react";
import { useAccount } from "wagmi";

export function useProposals() {
  const { address } = useAccount();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);

  const fetchProposals = React.useCallback(async () => {
    if (!address) return;

    try {
      const proposals = await getProposals();
      setProposals(proposals);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    }
  }, [address]);

  React.useEffect(() => {
    fetchProposals();
    const handleProposalUpdated = () => {
      fetchProposals();
    };

    emitter.on("proposalUpdated", handleProposalUpdated);

    return () => {
      emitter.off("proposalUpdated", handleProposalUpdated);
    };
  }, [fetchProposals]);

  return { proposals, refetchProposals: fetchProposals };
}

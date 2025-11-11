import { Proposal } from "@/interfaces/proposal";
import emitter from "@/lib/eventBus";
import { getProposals } from "@/services/api/governanceService";
import React, { useState, useCallback } from "react";
import { useAccount } from "wagmi";

export function useProposals() {
  const { address } = useAccount();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const proposals = await getProposals();
      console.log("Fetched proposals:", proposals);
      setProposals(proposals);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch proposals");
      setProposals([]);
    } finally {
      setIsLoading(false);
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

  return { proposals, refetchProposals: fetchProposals, isLoading, error };
}

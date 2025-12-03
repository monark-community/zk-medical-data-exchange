import { useState, useCallback, useEffect } from "react";
import { getStats, GovernanceStats } from "@/services/api/governanceService";
import emitter from "@/lib/eventBus";

export function useGovernance() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const governanceStats = await getStats();
      console.log("Fetched governance stats:", governanceStats);
      setStats(governanceStats);
    } catch (error) {
      console.error("Failed to fetch governance stats:", error);
      setError("Unable to load governance information. Please refresh the page.");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const handleProposalUpdated = () => {
      fetchStats();
    };

    emitter.on("proposalUpdated", handleProposalUpdated);

    return () => {
      emitter.off("proposalUpdated", handleProposalUpdated);
    };
  }, [fetchStats]);

  return { stats, refetchStats: fetchStats, isLoading, error };
}

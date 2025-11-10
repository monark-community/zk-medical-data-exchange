import { Proposal } from "@/interfaces/proposal";
import emitter from "@/lib/eventBus";
import { getProposals } from "@/services/api/governanceService";
import React, { useState } from "react";
import { useAccount } from "wagmi";

export function useProposals() {
  const { address } = useAccount();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const fetchProposals = async () => {
  //   if (!address) return;

  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     const proposals = await getProposals();
  //     console.log("Fetched proposals:", proposals);
  //     setProposals(proposals);
  //   } catch (error) {
  //     console.error("Failed to fetch proposals:", error);
  //     setError(error instanceof Error ? error.message : "Failed to fetch proposals");
  //     setProposals([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // React.useEffect(() => {
  //   fetchProposals();
  //   const handleProposalUpdated = () => {
  //     fetchProposals();
  //   };

  //   emitter.on("proposalUpdated", handleProposalUpdated);

  //   return () => {
  //     emitter.off("proposalUpdated", handleProposalUpdated);
  //   };
  // }, [fetchProposals]);
  const now = Date.now() / 1000;
  const fetchProposals = () => {};
  const testProposals: Proposal[] = [
    {
      id: 1,
      title: "Increase Treasury Reserve",
      description: "Proposal to increase the DAO treasury reserve by 10%.",
      category: 1,
      proposer: "0xA1B2C3D4E5",
      startTime: now - 3600,
      endTime: now + 7200,
      votesFor: 120,
      votesAgainst: 30,
      totalVoters: 150,
      state: 0, // Active
      executed: false,
      timeRemaining: Math.max(0, now + 7200 - now),
    },
    {
      id: 2,
      title: "Add Dark Mode",
      description: "Proposal to introduce a dark mode in the application UI.",
      category: 2,
      proposer: "0xF00DBABE99",
      startTime: now - 10000,
      endTime: now - 2000,
      votesFor: 90,
      votesAgainst: 10,
      totalVoters: 100,
      state: 1, // Passed
      executed: false,
      timeRemaining: 0,
    },
    {
      id: 3,
      title: "Remove Staking Fees",
      description: "Proposal to reduce staking fees from 2% to 0%.",
      category: 1,
      proposer: "0xDEADBEEF01",
      startTime: now - 5000,
      endTime: now - 1000,
      votesFor: 20,
      votesAgainst: 80,
      totalVoters: 100,
      state: 2, // Failed
      executed: false,
      timeRemaining: 0,
    },
    {
      id: 4,
      title: "Launch Mobile App",
      description: "Proposal to allocate budget for mobile app development.",
      category: 3,
      proposer: "0xC0FFEE1234",
      startTime: now - 2000,
      endTime: now + 4000,
      votesFor: 45,
      votesAgainst: 5,
      totalVoters: 50,
      state: 0, // Active
      executed: false,
      timeRemaining: Math.max(0, now + 4000 - now),
    },
  ];
  return { proposals: testProposals, refetchProposals: fetchProposals, isLoading, error };
  // return { proposals, refetchProposals: fetchProposals, isLoading, error };
}

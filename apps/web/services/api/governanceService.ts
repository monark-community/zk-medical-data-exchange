import { CreateProposalParams, CreateProposalResponse, Proposal } from "@/interfaces/proposal";
import { apiClient } from "@/services/core/apiClient";

export const getProposals = async (walletAddress?: string): Promise<Proposal[]> => {
  const { data } = await apiClient.get(`/governance/proposals`, {
    params: { userAddress: walletAddress },
  });

  return data.data;
};

export const getProposalsByWalletAddress = async (walletAddress: string): Promise<Proposal[]> => {
  const { data } = await apiClient.get(`/governance/users/${walletAddress}/proposals`);

  return data.data;
};

export const createProposal = async (
  proposal: CreateProposalParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data } = await apiClient.post<CreateProposalResponse>(
      `/governance/proposals`,
      proposal
    );

    return { success: data.success };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Network error";
    return { success: false, error: errorMessage };
  }
};

export const vote = async (
  vote: number,
  proposalId: number,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data } = await apiClient.post<CreateProposalResponse>(
      `/governance/proposals/${proposalId}/vote`,
      { choice: vote, walletAddress }
    );

    return { success: data.success };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Network error";
    return { success: false, error: errorMessage };
  }
};

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  avgParticipation: number;
  uniqueVoters: number;
  votingPower: number;
  totalVotes: number;
}

export const getStats = async (): Promise<GovernanceStats> => {
  const { data } = await apiClient.get(`/governance/stats`);
  console.log("Governance stats response data:", data);
  return data.data;
};

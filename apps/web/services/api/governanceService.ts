import {
  CreateProposalParams,
  CreateProposalResponse,
  Proposal,
  ProposalState,
} from "@/interfaces/proposal";
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

/**
 * Helper function to check if a proposal is currently active
 * A proposal is active if its state is Active AND the voting period hasn't ended
 * @param proposal The proposal to check
 * @returns true if the proposal is active and voting is still open, false otherwise
 */
export const isProposalActive = (proposal: Proposal): boolean => {
  // Must be in Active state
  if (proposal.state !== ProposalState.Active) {
    return false;
  }

  // Must have time remaining (voting period not ended)
  if (proposal.timeRemaining !== undefined) {
    return proposal.timeRemaining > 0;
  }

  // Fallback: check endTime directly
  const now = Math.floor(Date.now() / 1000);
  return now <= proposal.endTime;
};

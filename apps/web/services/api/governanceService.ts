import { CreateProposalParams, CreateProposalResponse, Proposal } from "@/interfaces/proposal";
import { apiClient } from "@/services/core/apiClient";

export const getProposals = async (): Promise<Proposal[]> => {
  const { data } = await apiClient.get(`/governance/proposals`);

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

import { Proposal } from "@/interfaces/proposal";
import { apiClient } from "@/services/core/apiClient";

export const getProposals = async (): Promise<Proposal[]> => {
  const { data } = await apiClient.get(`/governance/proposals`);

  return data.proposals;
};

import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  Proposal,
  ProposalState,
  ProposalCategory,
  VoteChoice,
  CreateProposalParams,
} from "@/interfaces/proposal";

const mockApiClient = {
  get: mock(() => Promise.resolve({ data: {} })) as any,
  post: mock(() => Promise.resolve({ data: {} })) as any,
  patch: mock(() => Promise.resolve({ data: {} })) as any,
  delete: mock(() => Promise.resolve({ data: {} })) as any,
};

mock.module("@/services/core/apiClient", () => ({
  apiClient: mockApiClient,
}));

import { getProposals, getProposalsByWalletAddress, createProposal, vote } from "./governanceService";

const mockProposal: Proposal = {
  id: 1,
  title: "Increase Data Sharing Incentives",
  description: "Proposal to increase token rewards for data sharing",
  category: ProposalCategory.Economics,
  proposer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
  votesFor: 100,
  votesAgainst: 50,
  totalVoters: 150,
  executed: false,
  state: ProposalState.Active,
  hasVoted: false,
  userVote: VoteChoice.None,
};

const mockProposals: Proposal[] = [
  mockProposal,
  {
    ...mockProposal,
    id: 2,
    title: "Update Privacy Policy",
    category: ProposalCategory.Privacy,
    state: ProposalState.Passed,
  },
  {
    ...mockProposal,
    id: 3,
    title: "Change Voting Duration",
    category: ProposalCategory.Governance,
    state: ProposalState.Failed,
  },
];

describe("GovernanceService - getProposals", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch all proposals without wallet address", async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: { data: mockProposals },
    });

    const result = await getProposals();

    expect(mockApiClient.get).toHaveBeenCalledWith("/governance/proposals", {
      params: { userAddress: undefined },
    });
    expect(result).toEqual(mockProposals);
  });

  it("should fetch proposals with wallet address filter", async () => {
    const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const userProposals = [mockProposals[0]];

    mockApiClient.get.mockResolvedValueOnce({
      data: { data: userProposals },
    });

    const result = await getProposals(walletAddress);

    expect(mockApiClient.get).toHaveBeenCalledWith("/governance/proposals", {
      params: { userAddress: walletAddress },
    });
    expect(result).toEqual(userProposals);
  });

  it("should return empty array when no proposals exist", async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    const result = await getProposals();

    expect(result).toEqual([]);
  });

  it("should throw error when API call fails", async () => {
    const errorMessage = "Network error";
    mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(getProposals()).rejects.toThrow(errorMessage);
  });
});

describe("GovernanceService - getProposalsByWalletAddress", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch proposals created by specific wallet address", async () => {
    const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const userProposals = [mockProposals[0], mockProposals[1]];

    mockApiClient.get.mockResolvedValueOnce({
      data: { data: userProposals },
    });

    const result = await getProposalsByWalletAddress(walletAddress);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/governance/users/${walletAddress}/proposals`
    );
    expect(result).toEqual(userProposals);
  });

  it("should return empty array when user has no proposals", async () => {
    const walletAddress = "0x1234567890123456789012345678901234567890";

    mockApiClient.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    const result = await getProposalsByWalletAddress(walletAddress);

    expect(result).toEqual([]);
  });

  it("should throw error when API call fails", async () => {
    const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const errorMessage = "Failed to fetch user proposals";
    
    mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(getProposalsByWalletAddress(walletAddress)).rejects.toThrow(errorMessage);
  });
});

describe("GovernanceService - createProposal", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  const validProposalParams: CreateProposalParams = {
    title: "New Economic Proposal",
    description: "This proposal aims to improve token economics",
    category: ProposalCategory.Economics,
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    duration: 7, // 7 days
  };

  it("should successfully create a proposal", async () => {
    mockApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockProposal,
        transactionHash: "0xabc123...",
      },
    });

    const result = await createProposal(validProposalParams);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/governance/proposals",
      validProposalParams
    );
    expect(result).toEqual({ success: true });
  });

  it("should handle API error with error message in response", async () => {
    const errorMessage = "Insufficient governance tokens";
    
    mockApiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    const result = await createProposal(validProposalParams);

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });

  it("should handle network error without response", async () => {
    const errorMessage = "Connection timeout";
    
    mockApiClient.post.mockRejectedValueOnce(new Error(errorMessage));

    const result = await createProposal(validProposalParams);

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });

  it("should handle unknown error", async () => {
  mockApiClient.post.mockRejectedValueOnce({} as any);

    const result = await createProposal(validProposalParams);

    expect(result).toEqual({
      success: false,
      error: "Network error",
    });
  });

  it("should create proposal with different categories", async () => {
    const categories = [
      ProposalCategory.Economics,
      ProposalCategory.Privacy,
      ProposalCategory.Governance,
      ProposalCategory.Policy,
      ProposalCategory.Other,
    ];

    for (const category of categories) {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const params = { ...validProposalParams, category };
      const result = await createProposal(params);

      expect(result.success).toBe(true);
    }
  });
});

describe("GovernanceService - vote", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  const proposalId = 1;
  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

  it("should successfully vote FOR a proposal", async () => {
    mockApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        transactionHash: "0xdef456...",
      },
    });

    const result = await vote(VoteChoice.For, proposalId, walletAddress);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/governance/proposals/${proposalId}/vote`,
      { choice: VoteChoice.For, walletAddress }
    );
    expect(result).toEqual({ success: true });
  });

  it("should successfully vote AGAINST a proposal", async () => {
    mockApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        transactionHash: "0xghi789...",
      },
    });

    const result = await vote(VoteChoice.Against, proposalId, walletAddress);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/governance/proposals/${proposalId}/vote`,
      { choice: VoteChoice.Against, walletAddress }
    );
    expect(result).toEqual({ success: true });
  });

  it("should handle voting on different proposal IDs", async () => {
    const proposalIds = [1, 2, 3, 99, 1000];

    for (const id of proposalIds) {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await vote(VoteChoice.For, id, walletAddress);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/governance/proposals/${id}/vote`,
        expect.any(Object)
      );
      expect(result.success).toBe(true);
    }
  });

  it("should handle error when user already voted", async () => {
    const errorMessage = "User has already voted on this proposal";
    
    mockApiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    const result = await vote(VoteChoice.For, proposalId, walletAddress);

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });

  it("should handle error when proposal is not active", async () => {
    const errorMessage = "Proposal voting period has ended";
    
    mockApiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    const result = await vote(VoteChoice.For, proposalId, walletAddress);

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });

  it("should handle network error", async () => {
    const errorMessage = "Request timeout";
    
    mockApiClient.post.mockRejectedValueOnce(new Error(errorMessage));

    const result = await vote(VoteChoice.For, proposalId, walletAddress);

    expect(result).toEqual({
      success: false,
      error: errorMessage,
    });
  });


  it("should handle unknown error", async () => {
  mockApiClient.post.mockRejectedValueOnce({} as any);

    const result = await vote(VoteChoice.For, proposalId, walletAddress);

    expect(result).toEqual({
      success: false,
      error: "Network error",
    });
  });
});

describe("GovernanceService - Integration Scenarios", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
  });

  it("should handle complete proposal lifecycle", async () => {
    const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    
    mockApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: mockProposal },
    });

    const createResult = await createProposal({
      title: "Test Proposal",
      description: "Test",
      category: ProposalCategory.Economics,
      walletAddress,
      duration: 7,
    });

    expect(createResult.success).toBe(true);

    mockApiClient.get.mockResolvedValueOnce({
      data: { data: [mockProposal] },
    });

    const proposals = await getProposals();
    expect(proposals).toHaveLength(1);

    mockApiClient.post.mockResolvedValueOnce({
      data: { success: true },
    });

    const voteResult = await vote(VoteChoice.For, mockProposal.id, walletAddress);
    expect(voteResult.success).toBe(true);

    mockApiClient.get.mockResolvedValueOnce({
      data: { data: [mockProposal] },
    });

    const userProposals = await getProposalsByWalletAddress(walletAddress);
    expect(userProposals).toHaveLength(1);
  });

  it("should handle multiple users voting on same proposal", async () => {
    const voters = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x1234567890123456789012345678901234567890",
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    ];

    for (const voter of voters) {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await vote(VoteChoice.For, 1, voter);
      expect(result.success).toBe(true);
    }

    expect(mockApiClient.post).toHaveBeenCalledTimes(voters.length);
  });
});

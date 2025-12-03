import { describe, test, expect, beforeEach, mock, afterEach, beforeAll } from "bun:test";
import type { Request, Response } from "express";

// Mock governance service functions
const mockGetPlatformStats = mock(() => Promise.resolve({} as any));
const mockGetAllProposals = mock(() => Promise.resolve([] as any));
const mockGetProposal = mock(() => Promise.resolve(null as any));
const mockCreateProposal = mock(() => Promise.resolve({ success: true } as any));
const mockVote = mock(() => Promise.resolve({ success: true } as any));
const mockGetUserProposals = mock(() => Promise.resolve([] as any));
const mockGetUserVotes = mock(() => Promise.resolve([] as any));

// Mock governance service module
mock.module("@/services/governanceService", () => ({
  governanceService: {
    getPlatformStats: mockGetPlatformStats,
    getAllProposals: mockGetAllProposals,
    getProposal: mockGetProposal,
    createProposal: mockCreateProposal,
    vote: mockVote,
    getUserProposals: mockGetUserProposals,
    getUserVotes: mockGetUserVotes,
  },
  ProposalCategory: {
    Economics: 0,
    Privacy: 1,
    Governance: 2,
    Policy: 3,
    Other: 4,

    0: "Economics",
    1: "Privacy",
    2: "Governance",
    3: "Policy",
    4: "Other",
  },
  VoteChoice: {
    None: 0,
    For: 1,
    Against: 2,
    Abstain: 3,

    0: "None",
    1: "For",
    2: "Against",
    3: "Abstain",
  },
  ProposalState: {
    Active: 0,
    Passed: 1,
    Failed: 2,

    0: "Active",
    1: "Passed",
    2: "Failed",
  },
}));

// Mock logger
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {}),
};

mock.module("@/utils/logger", () => ({
  default: mockLogger,
}));

// Mock audit service
const mockLogProposalCreation = mock(() => Promise.resolve());
const mockLogVoteCast = mock(() => Promise.resolve());

mock.module("@/services/auditService", () => ({
  auditService: {
    logProposalCreation: mockLogProposalCreation,
    logVoteCast: mockLogVoteCast,
  },
}));

// Mock viem and related crypto modules to prevent actual blockchain calls
mock.module("viem", () => ({
  createWalletClient: mock(() => ({})),
  createPublicClient: mock(() => ({})),
  http: mock(() => ({})),
  decodeEventLog: mock(() => ({})),
}));

mock.module("viem/chains", () => ({
  sepolia: {},
}));

mock.module("viem/accounts", () => ({
  privateKeyToAccount: mock(() => ({})),
}));

mock.module("@supabase/supabase-js", () => ({
  createClient: mock(() => ({})),
}));

// Import controller after mocks
let governanceController: {
  getStats: any;
  getAllProposals: any;
  getProposal: any;
  createProposal: any;
  vote: any;
  getUserProposals: any;
  getUserVotes: any;
};
beforeAll(async () => {
  governanceController = await import("./governanceController");
});

// Helper function to create mock request/response
function mockReqRes(body: any = {}, params: any = {}, query: any = {}) {
  const req = {
    body,
    params,
    query,
  };

  const res = {
    status: mock(() => res),
    json: mock(() => {}),
  };

  return { req, res };
}

describe("governanceController", () => {
  beforeEach(() => {
    // Clear all mocks
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockGetPlatformStats.mockClear();
    mockGetAllProposals.mockClear();
    mockGetProposal.mockClear();
    mockCreateProposal.mockClear();
    mockVote.mockClear();
    mockGetUserProposals.mockClear();
    mockGetUserVotes.mockClear();
    mockLogProposalCreation.mockClear();
    mockLogVoteCast.mockClear();
  });

  describe("getStats", () => {
    test("returns platform statistics successfully", async () => {
      const mockStats = {
        totalProposals: 10,
        activeProposals: 3,
        totalVotes: 50,
        uniqueVoters: 25,
        avgParticipation: 0.75,
        proposalsPassed: 7,
      };

      mockGetPlatformStats.mockResolvedValue(mockStats);
      const { req, res } = mockReqRes();

      await governanceController.getStats(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith("GET /governance/stats");
      expect(mockGetPlatformStats).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    test("handles error when fetching stats", async () => {
      mockGetPlatformStats.mockRejectedValue(new Error("Database error"));
      const { req, res } = mockReqRes();

      await governanceController.getStats(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to get governance stats"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch governance statistics",
      });
    });
  });

  describe("getAllProposals", () => {
    test("returns all proposals without user address", async () => {
      const mockProposals = [
        { id: 1, title: "Proposal 1" },
        { id: 2, title: "Proposal 2" },
      ];

      mockGetAllProposals.mockResolvedValue(mockProposals);
      const { req, res } = mockReqRes();

      await governanceController.getAllProposals(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userAddress: undefined },
        "GET /governance/proposals"
      );
      expect(mockGetAllProposals).toHaveBeenCalledWith(undefined);
      expect(mockLogger.info).toHaveBeenCalledWith({ count: 2 }, "Fetched proposals");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposals,
      });
    });

    test("returns all proposals with user address", async () => {
      const mockProposals = [{ id: 1, title: "Proposal 1", hasVoted: true }];
      const userAddress = "0x1234567890123456789012345678901234567890";

      mockGetAllProposals.mockResolvedValue(mockProposals);
      const { req, res } = mockReqRes({}, {}, { userAddress });

      await governanceController.getAllProposals(req as any, res as any);

      expect(mockGetAllProposals).toHaveBeenCalledWith(userAddress);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposals,
      });
    });

    test("handles error when fetching proposals", async () => {
      mockGetAllProposals.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes();

      await governanceController.getAllProposals(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to get proposals"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch proposals",
      });
    });
  });

  describe("getProposal", () => {
    test("returns proposal successfully", async () => {
      const mockProposal = {
        id: 1,
        title: "Test Proposal",
        description: "Description",
      };

      mockGetProposal.mockResolvedValue(mockProposal);
      const { req, res } = mockReqRes({}, { id: "1" });

      await governanceController.getProposal(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { proposalId: 1, userAddress: undefined },
        "GET /governance/proposals/:id"
      );
      expect(mockGetProposal).toHaveBeenCalledWith(1, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposal,
      });
    });

    test("returns proposal with user address", async () => {
      const mockProposal = { id: 1, title: "Test", hasVoted: true };
      const userAddress = "0x1234567890123456789012345678901234567890";

      mockGetProposal.mockResolvedValue(mockProposal);
      const { req, res } = mockReqRes({}, { id: "1" }, { userAddress });

      await governanceController.getProposal(req as any, res as any);

      expect(mockGetProposal).toHaveBeenCalledWith(1, userAddress);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 400 when proposal ID is missing", async () => {
      const { req, res } = mockReqRes({}, {});

      await governanceController.getProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Proposal ID is required",
      });
      expect(mockGetProposal).not.toHaveBeenCalled();
    });

    test("returns 400 when proposal ID is invalid", async () => {
      const { req, res } = mockReqRes({}, { id: "invalid" });

      await governanceController.getProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid proposal ID",
      });
      expect(mockGetProposal).not.toHaveBeenCalled();
    });

    test("returns 404 when proposal not found", async () => {
      mockGetProposal.mockResolvedValue(null);
      const { req, res } = mockReqRes({}, { id: "999" });

      await governanceController.getProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Proposal not found",
      });
    });

    test("handles error when fetching proposal", async () => {
      mockGetProposal.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes({}, { id: "1" });

      await governanceController.getProposal(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to get proposal"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch proposal",
      });
    });
  });

  describe("createProposal", () => {
    test("creates proposal successfully", async () => {
      const proposalData = {
        title: "Test Proposal",
        description: "This is a test proposal",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      };

      const mockResult = {
        success: true,
        data: { proposalId: 1 },
        transactionHash: "0xabcdef",
      };

      mockCreateProposal.mockResolvedValue(mockResult);
      const { req, res } = mockReqRes(proposalData);

      await governanceController.createProposal(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          title: "Test Proposal",
          category: 0,
          walletAddress: proposalData.walletAddress,
          duration: 604800,
        },
        "POST /governance/proposals"
      );
      expect(mockCreateProposal).toHaveBeenCalledWith({
        title: "Test Proposal",
        description: "This is a test proposal",
        category: 0,
        walletAddress: proposalData.walletAddress,
        duration: 604800,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { proposalId: 1 },
        transactionHash: "0xabcdef",
      });
      expect(mockLogProposalCreation).toHaveBeenCalledWith(
        proposalData.walletAddress,
        "1",
        "Economics",
        true,
        {
          title: "Test Proposal",
          description: "This is a test proposal",
          duration: 604800,
          transactionHash: "0xabcdef",
        }
      );
    });

    test("trims title and description whitespace", async () => {
      const proposalData = {
        title: "  Test Proposal  ",
        description: "  Description  ",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      };

      mockCreateProposal.mockResolvedValue({
        success: true,
        data: { proposalId: 1 },
      });
      const { req, res } = mockReqRes(proposalData);

      await governanceController.createProposal(req as any, res as any);

      expect(mockCreateProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Proposal",
          description: "Description",
        })
      );
    });

    test("returns 400 when title is missing", async () => {
      const { req, res } = mockReqRes({
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Title is required",
      });
      expect(mockCreateProposal).not.toHaveBeenCalled();
    });

    test("returns 400 when title is empty after trim", async () => {
      const { req, res } = mockReqRes({
        title: "   ",
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Title is required",
      });
    });

    test("returns 400 when description is missing", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Description is required",
      });
    });

    test("returns 400 when description is empty after trim", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "   ",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Description is required",
      });
    });

    test("returns 400 when category is undefined", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid category (must be 0-4: Economics, Privacy, Governance, Policy, Other)",
      });
    });

    test("returns 400 when category is less than 0", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: -1,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid category (must be 0-4: Economics, Privacy, Governance, Policy, Other)",
      });
    });

    test("returns 400 when category is greater than 4", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: 5,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid category (must be 0-4: Economics, Privacy, Governance, Policy, Other)",
      });
    });

    test("returns 400 when wallet address is missing", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: 0,
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Wallet address is required",
      });
    });

    test("returns 400 when duration is missing", async () => {
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Duration is required",
      });
    });

    test("returns 400 when service returns failure", async () => {
      mockCreateProposal.mockResolvedValue({
        success: false,
        error: "Insufficient voting power",
      });

      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Insufficient voting power",
      });
      expect(mockLogProposalCreation).not.toHaveBeenCalled();
    });

    test("handles audit service failure gracefully", async () => {
      const proposalData = {
        title: "Test Proposal",
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      };

      mockCreateProposal.mockResolvedValue({
        success: true,
        data: { proposalId: 1 },
        transactionHash: "0xabcdef",
      });
      mockLogProposalCreation.mockRejectedValue(new Error("Audit failed"));

      const { req, res } = mockReqRes(proposalData);

      await governanceController.createProposal(req as any, res as any);

      // Wait for audit log promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { auditError: expect.any(Error) },
        "Failed to log proposal creation to audit trail"
      );
    });

    test("handles error when creating proposal", async () => {
      mockCreateProposal.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes({
        title: "Title",
        description: "Description",
        category: 0,
        walletAddress: "0x1234567890123456789012345678901234567890",
        duration: 604800,
      });

      await governanceController.createProposal(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to create proposal"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to create proposal",
      });
    });
  });

  describe("vote", () => {
    test("casts vote successfully for choice 1 (For)", async () => {
      const voteData = {
        choice: 1,
        walletAddress: "0x1234567890123456789012345678901234567890",
      };

      mockVote.mockResolvedValue({
        success: true,
        data: { proposalId: 1, choice: 1 },
        transactionHash: "0xabcdef",
      });

      const { req, res } = mockReqRes(voteData, { id: "1" });

      await governanceController.vote(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          proposalId: 1,
          choice: 1,
          walletAddress: voteData.walletAddress,
        },
        "POST /governance/proposals/:id/vote"
      );
      expect(mockVote).toHaveBeenCalledWith({
        proposalId: 1,
        choice: 1,
        walletAddress: voteData.walletAddress,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { proposalId: 1, choice: 1 },
        transactionHash: "0xabcdef",
      });
      expect(mockLogVoteCast).toHaveBeenCalledWith(voteData.walletAddress, "1", "yes", true, {
        transactionHash: "0xabcdef",
      });
    });

    test("casts vote successfully for choice 2 (Against)", async () => {
      const voteData = {
        choice: 2,
        walletAddress: "0x1234567890123456789012345678901234567890",
      };

      mockVote.mockResolvedValue({
        success: true,
        data: { proposalId: 1, choice: 2 },
        transactionHash: "0xabcdef",
      });

      const { req, res } = mockReqRes(voteData, { id: "1" });

      await governanceController.vote(req as any, res as any);

      expect(mockLogVoteCast).toHaveBeenCalledWith(voteData.walletAddress, "1", "no", true, {
        transactionHash: "0xabcdef",
      });
    });

    test("casts vote successfully for choice 3 (Abstain)", async () => {
      const voteData = {
        choice: 3,
        walletAddress: "0x1234567890123456789012345678901234567890",
      };

      mockVote.mockResolvedValue({
        success: true,
        data: { proposalId: 1, choice: 3 },
        transactionHash: "0xabcdef",
      });

      const { req, res } = mockReqRes(voteData, { id: "1" });

      await governanceController.vote(req as any, res as any);

      expect(mockLogVoteCast).toHaveBeenCalledWith(voteData.walletAddress, "1", "abstain", true, {
        transactionHash: "0xabcdef",
      });
    });

    test("returns 400 when proposal ID is missing", async () => {
      const { req, res } = mockReqRes({
        choice: 1,
        walletAddress: "0x1234567890123456789012345678901234567890",
      });

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Proposal ID is required",
      });
      expect(mockVote).not.toHaveBeenCalled();
    });

    test("returns 400 when proposal ID is invalid", async () => {
      const { req, res } = mockReqRes(
        {
          choice: 1,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "invalid" }
      );

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid proposal ID",
      });
      expect(mockVote).not.toHaveBeenCalled();
    });

    test("returns 400 when choice is undefined", async () => {
      const { req, res } = mockReqRes(
        { walletAddress: "0x1234567890123456789012345678901234567890" },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid vote choice (must be 1: For, 2: Against, 3: Abstain)",
      });
    });

    test("returns 400 when choice is less than 1", async () => {
      const { req, res } = mockReqRes(
        {
          choice: 0,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid vote choice (must be 1: For, 2: Against, 3: Abstain)",
      });
    });

    test("returns 400 when choice is greater than 3", async () => {
      const { req, res } = mockReqRes(
        {
          choice: 4,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid vote choice (must be 1: For, 2: Against, 3: Abstain)",
      });
    });

    test("returns 400 when wallet address is missing", async () => {
      const { req, res } = mockReqRes({ choice: 1 }, { id: "1" });

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Wallet address is required",
      });
    });

    test("returns 400 when service returns failure", async () => {
      mockVote.mockResolvedValue({
        success: false,
        error: "Already voted",
      });

      const { req, res } = mockReqRes(
        {
          choice: 1,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Already voted",
      });
      expect(mockLogVoteCast).not.toHaveBeenCalled();
    });

    test("handles audit service failure gracefully", async () => {
      mockVote.mockResolvedValue({
        success: true,
        data: { proposalId: 1, choice: 1 },
        transactionHash: "0xabcdef",
      });
      mockLogVoteCast.mockRejectedValue(new Error("Audit failed"));

      const { req, res } = mockReqRes(
        {
          choice: 1,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      // Wait for audit log promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { auditError: expect.any(Error) },
        "Failed to log vote to audit trail"
      );
    });

    test("handles error when casting vote", async () => {
      mockVote.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes(
        {
          choice: 1,
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        { id: "1" }
      );

      await governanceController.vote(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to cast vote"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to cast vote",
      });
    });
  });

  describe("getUserProposals", () => {
    test("returns user proposals successfully", async () => {
      const mockProposals = [
        { id: 1, title: "User Proposal 1" },
        { id: 2, title: "User Proposal 2" },
      ];
      const userAddress = "0x1234567890123456789012345678901234567890";

      mockGetUserProposals.mockResolvedValue(mockProposals);
      const { req, res } = mockReqRes({}, { address: userAddress });

      await governanceController.getUserProposals(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userAddress },
        "GET /governance/users/:address/proposals"
      );
      expect(mockGetUserProposals).toHaveBeenCalledWith(userAddress);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProposals,
      });
    });

    test("returns 400 when user address is missing", async () => {
      const { req, res } = mockReqRes({}, {});

      await governanceController.getUserProposals(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User address is required",
      });
      expect(mockGetUserProposals).not.toHaveBeenCalled();
    });

    test("handles error when fetching user proposals", async () => {
      mockGetUserProposals.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes(
        {},
        { address: "0x1234567890123456789012345678901234567890" }
      );

      await governanceController.getUserProposals(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to get user proposals"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch user proposals",
      });
    });
  });

  describe("getUserVotes", () => {
    test("returns user votes successfully", async () => {
      const mockVotes = [
        { proposalId: 1, choice: 1 },
        { proposalId: 2, choice: 2 },
      ];
      const userAddress = "0x1234567890123456789012345678901234567890";

      mockGetUserVotes.mockResolvedValue(mockVotes);
      const { req, res } = mockReqRes({}, { address: userAddress });

      await governanceController.getUserVotes(req as any, res as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userAddress },
        "GET /governance/users/:address/votes"
      );
      expect(mockGetUserVotes).toHaveBeenCalledWith(userAddress);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockVotes,
      });
    });

    test("returns 400 when user address is missing", async () => {
      const { req, res } = mockReqRes({}, {});

      await governanceController.getUserVotes(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User address is required",
      });
      expect(mockGetUserVotes).not.toHaveBeenCalled();
    });

    test("handles error when fetching user votes", async () => {
      mockGetUserVotes.mockRejectedValue(new Error("Service error"));
      const { req, res } = mockReqRes(
        {},
        { address: "0x1234567890123456789012345678901234567890" }
      );

      await governanceController.getUserVotes(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to get user votes"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch user votes",
      });
    });
  });
});

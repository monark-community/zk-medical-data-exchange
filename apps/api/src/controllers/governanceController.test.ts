// import { describe, it, expect, mock, beforeEach } from "bun:test";
// import type { Request, Response } from "express";
// import * as governanceController from "./governanceController";
// import { governanceService, ProposalCategory, VoteChoice } from "../services/governanceService";
// import { auditService } from "../services/auditService";

// (process.env as any).NODE_ENV = "test";

// // Mock functions
// const mockGetPlatformStats = mock();
// const mockGetAllProposals = mock();
// const mockGetProposal = mock();
// const mockCreateProposal = mock();
// const mockVote = mock();
// const mockGetUserProposals = mock();
// const mockGetUserVotes = mock();
// const mockLogProposalCreation = mock();
// const mockLogVoteCast = mock();

// // Replace service methods with mocks
// governanceService.getPlatformStats = mockGetPlatformStats;
// governanceService.getAllProposals = mockGetAllProposals;
// governanceService.getProposal = mockGetProposal;
// governanceService.createProposal = mockCreateProposal;
// governanceService.vote = mockVote;
// governanceService.getUserProposals = mockGetUserProposals;
// governanceService.getUserVotes = mockGetUserVotes;
// auditService.logProposalCreation = mockLogProposalCreation;
// auditService.logVoteCast = mockLogVoteCast;

// // Helper to create mock Express request
// function createMockRequest(
//   params: Record<string, any> = {},
//   query: Record<string, any> = {},
//   body: Record<string, any> = {}
// ): Partial<Request> {
//   return {
//     params,
//     query,
//     body,
//   };
// }

// // Helper to create mock Express response
// function createMockResponse(): Partial<Response> {
//   const res: any = {
//     statusCode: 200,
//     jsonData: null,
//   };

//   res.status = mock((code: number) => {
//     res.statusCode = code;
//     return res;
//   });

//   res.json = mock((data: any) => {
//     res.jsonData = data;
//     return res;
//   });

//   return res;
// }

// describe("GovernanceController", () => {
//   beforeEach(() => {
//     // Reset all mocks before each test
//     mockGetPlatformStats.mockReset();
//     mockGetAllProposals.mockReset();
//     mockGetProposal.mockReset();
//     mockCreateProposal.mockReset();
//     mockVote.mockReset();
//     mockGetUserProposals.mockReset();
//     mockGetUserVotes.mockReset();
//     mockLogProposalCreation.mockReset();
//     mockLogVoteCast.mockReset();
//   });

//   describe("getStats", () => {
//     it("returns platform stats successfully", async () => {
//       const mockStats = {
//         totalProposals: 10,
//         activeProposals: 3,
//         totalVotes: 50,
//         uniqueVoters: 20,
//         avgParticipation: 25.0,
//         proposalsPassed: 5,
//       };

//       mockGetPlatformStats.mockResolvedValueOnce(mockStats);

//       const req = createMockRequest();
//       const res = createMockResponse();

//       await governanceController.getStats(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockStats,
//       });
//       expect(mockGetPlatformStats).toHaveBeenCalledTimes(1);
//     });

//     it("returns error when service fails", async () => {
//       mockGetPlatformStats.mockRejectedValueOnce(new Error("Database error"));

//       const req = createMockRequest();
//       const res = createMockResponse();

//       await governanceController.getStats(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to fetch governance statistics",
//       });
//     });
//   });

//   describe("getAllProposals", () => {
//     it("returns all proposals without user address", async () => {
//       const mockProposals = [
//         { id: 1, title: "Proposal 1" },
//         { id: 2, title: "Proposal 2" },
//       ];

//       mockGetAllProposals.mockResolvedValueOnce(mockProposals);

//       const req = createMockRequest({}, {});
//       const res = createMockResponse();

//       await governanceController.getAllProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposals,
//       });
//       expect(mockGetAllProposals).toHaveBeenCalledWith(undefined);
//     });

//     it("returns all proposals with user address", async () => {
//       const userAddress = "0x" + "1".repeat(40);
//       const mockProposals = [
//         { id: 1, title: "Proposal 1", hasVoted: true },
//         { id: 2, title: "Proposal 2", hasVoted: false },
//       ];

//       mockGetAllProposals.mockResolvedValueOnce(mockProposals);

//       const req = createMockRequest({}, { userAddress });
//       const res = createMockResponse();

//       await governanceController.getAllProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposals,
//       });
//       expect(mockGetAllProposals).toHaveBeenCalledWith(userAddress);
//     });

//     it("returns error when service fails", async () => {
//       mockGetAllProposals.mockRejectedValueOnce(new Error("Service error"));

//       const req = createMockRequest();
//       const res = createMockResponse();

//       await governanceController.getAllProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to fetch proposals",
//       });
//     });
//   });

//   describe("getProposal", () => {
//     it("returns error when proposal ID is missing", async () => {
//       const req = createMockRequest({}, {});
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Proposal ID is required",
//       });
//       expect(mockGetProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when proposal ID is invalid", async () => {
//       const req = createMockRequest({ id: "invalid" }, {});
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Invalid proposal ID",
//       });
//       expect(mockGetProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when proposal is not found", async () => {
//       mockGetProposal.mockResolvedValueOnce(null);

//       const req = createMockRequest({ id: "1" }, {});
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Proposal not found",
//       });
//       expect(mockGetProposal).toHaveBeenCalledWith(1, undefined);
//     });

//     it("returns proposal successfully without user address", async () => {
//       const mockProposal = {
//         id: 1,
//         title: "Test Proposal",
//         description: "Description",
//         category: ProposalCategory.Other,
//       };

//       mockGetProposal.mockResolvedValueOnce(mockProposal);

//       const req = createMockRequest({ id: "1" }, {});
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposal,
//       });
//       expect(mockGetProposal).toHaveBeenCalledWith(1, undefined);
//     });

//     it("returns proposal successfully with user address", async () => {
//       const userAddress = "0x" + "1".repeat(40);
//       const mockProposal = {
//         id: 1,
//         title: "Test Proposal",
//         hasVoted: true,
//         userVote: VoteChoice.For,
//       };

//       mockGetProposal.mockResolvedValueOnce(mockProposal);

//       const req = createMockRequest({ id: "1" }, { userAddress });
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposal,
//       });
//       expect(mockGetProposal).toHaveBeenCalledWith(1, userAddress);
//     });

//     it("returns error when service fails", async () => {
//       mockGetProposal.mockRejectedValueOnce(new Error("Service error"));

//       const req = createMockRequest({ id: "1" }, {});
//       const res = createMockResponse();

//       await governanceController.getProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to fetch proposal",
//       });
//     });
//   });

//   describe("createProposal", () => {
//     it("returns error when title is missing", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           description: "Description",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Title is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when title is empty", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "   ",
//           description: "Description",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Title is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when description is missing", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Description is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when description is empty", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "   ",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Description is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when category is invalid", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "Description",
//           category: 10,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Invalid category (must be 0-4: Economics, Privacy, Governance, Policy, Other)",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when wallet address is missing", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "Description",
//           category: ProposalCategory.Other,
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Wallet address is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when duration is missing", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "Description",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Duration is required",
//       });
//       expect(mockCreateProposal).not.toHaveBeenCalled();
//     });

//     it("returns error when service returns failure", async () => {
//       mockCreateProposal.mockResolvedValueOnce({
//         success: false,
//         error: "Blockchain error",
//       });

//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "Description",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Blockchain error",
//       });
//       expect(mockCreateProposal).toHaveBeenCalledTimes(1);
//     });

//     it("creates proposal successfully and logs to audit", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "a".repeat(64);

//       mockCreateProposal.mockResolvedValueOnce({
//         success: true,
//         data: { proposalId: 1 },
//         transactionHash: txHash,
//       });

//       mockLogProposalCreation.mockResolvedValueOnce(undefined);

//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Test Proposal",
//           description: "Test Description",
//           category: ProposalCategory.Economics,
//           walletAddress,
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(201);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: { proposalId: 1 },
//         transactionHash: txHash,
//       });

//       expect(mockCreateProposal).toHaveBeenCalledWith({
//         title: "Test Proposal",
//         description: "Test Description",
//         category: ProposalCategory.Economics,
//         walletAddress,
//         duration: 86400,
//       });

//       // Wait for audit log to be called
//       await new Promise((resolve) => setTimeout(resolve, 10));

//       expect(mockLogProposalCreation).toHaveBeenCalledWith(walletAddress, "1", "Economics", true, {
//         title: "Test Proposal",
//         description: "Test Description",
//         duration: 86400,
//         transactionHash: txHash,
//       });
//     });

//     it("creates proposal successfully even when audit logging fails", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "a".repeat(64);

//       mockCreateProposal.mockResolvedValueOnce({
//         success: true,
//         data: { proposalId: 1 },
//         transactionHash: txHash,
//       });

//       mockLogProposalCreation.mockRejectedValueOnce(new Error("Audit error"));

//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Test Proposal",
//           description: "Test Description",
//           category: ProposalCategory.Other,
//           walletAddress,
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(201);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: { proposalId: 1 },
//         transactionHash: txHash,
//       });
//     });

//     it("returns error when service throws exception", async () => {
//       mockCreateProposal.mockRejectedValueOnce(new Error("Unexpected error"));

//       const req = createMockRequest(
//         {},
//         {},
//         {
//           title: "Title",
//           description: "Description",
//           category: ProposalCategory.Other,
//           walletAddress: "0x" + "1".repeat(40),
//           duration: 86400,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.createProposal(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to create proposal",
//       });
//     });
//   });

//   describe("vote", () => {
//     it("returns error when proposal ID is missing", async () => {
//       const req = createMockRequest(
//         {},
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Proposal ID is required",
//       });
//       expect(mockVote).not.toHaveBeenCalled();
//     });

//     it("returns error when proposal ID is invalid", async () => {
//       const req = createMockRequest(
//         { id: "invalid" },
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Invalid proposal ID",
//       });
//       expect(mockVote).not.toHaveBeenCalled();
//     });

//     it("returns error when vote choice is invalid", async () => {
//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: 10,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Invalid vote choice (must be 1: For, 2: Against)",
//       });
//       expect(mockVote).not.toHaveBeenCalled();
//     });

//     it("returns error when wallet address is missing", async () => {
//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.For,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Wallet address is required",
//       });
//       expect(mockVote).not.toHaveBeenCalled();
//     });

//     it("returns error when service returns failure", async () => {
//       mockVote.mockResolvedValueOnce({
//         success: false,
//         error: "Already voted",
//       });

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Already voted",
//       });
//       expect(mockVote).toHaveBeenCalledTimes(1);
//     });

//     it("casts vote successfully and logs to audit (For)", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "b".repeat(64);

//       mockVote.mockResolvedValueOnce({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });

//       mockLogVoteCast.mockResolvedValueOnce(undefined);

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });

//       expect(mockVote).toHaveBeenCalledWith({
//         proposalId: 1,
//         choice: VoteChoice.For,
//         walletAddress,
//       });

//       // Wait for audit log to be called
//       await new Promise((resolve) => setTimeout(resolve, 10));

//       expect(mockLogVoteCast).toHaveBeenCalledWith(walletAddress, "1", "yes", true, {
//         transactionHash: txHash,
//       });
//     });

//     it("casts vote successfully and logs to audit (Against)", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "b".repeat(64);

//       mockVote.mockResolvedValueOnce({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });

//       mockLogVoteCast.mockResolvedValueOnce(undefined);

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.Against,
//           walletAddress,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);

//       // Wait for audit log to be called
//       await new Promise((resolve) => setTimeout(resolve, 10));

//       expect(mockLogVoteCast).toHaveBeenCalledWith(walletAddress, "1", "no", true, {
//         transactionHash: txHash,
//       });
//     });

//     it("casts vote successfully and logs to audit (Abstain)", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "b".repeat(64);

//       mockVote.mockResolvedValueOnce({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });

//       mockLogVoteCast.mockResolvedValueOnce(undefined);

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.Abstain,
//           walletAddress,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);

//       // Wait for audit log to be called
//       await new Promise((resolve) => setTimeout(resolve, 10));

//       expect(mockLogVoteCast).toHaveBeenCalledWith(walletAddress, "1", "abstain", true, {
//         transactionHash: txHash,
//       });
//     });

//     it("casts vote successfully even when audit logging fails", async () => {
//       const walletAddress = "0x" + "1".repeat(40);
//       const txHash = "0x" + "b".repeat(64);

//       mockVote.mockResolvedValueOnce({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });

//       mockLogVoteCast.mockRejectedValueOnce(new Error("Audit error"));

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress,
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: {},
//         transactionHash: txHash,
//       });
//     });

//     it("returns error when service throws exception", async () => {
//       mockVote.mockRejectedValueOnce(new Error("Unexpected error"));

//       const req = createMockRequest(
//         { id: "1" },
//         {},
//         {
//           choice: VoteChoice.For,
//           walletAddress: "0x" + "1".repeat(40),
//         }
//       );
//       const res = createMockResponse();

//       await governanceController.vote(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to cast vote",
//       });
//     });
//   });

//   describe("getUserProposals", () => {
//     it("returns error when user address is missing", async () => {
//       const req = createMockRequest({}, {});
//       const res = createMockResponse();

//       await governanceController.getUserProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "User address is required",
//       });
//       expect(mockGetUserProposals).not.toHaveBeenCalled();
//     });

//     it("returns user proposals successfully", async () => {
//       const userAddress = "0x" + "1".repeat(40);
//       const mockProposals = [
//         { id: 1, title: "User Proposal 1" },
//         { id: 2, title: "User Proposal 2" },
//       ];

//       mockGetUserProposals.mockResolvedValueOnce(mockProposals);

//       const req = createMockRequest({ address: userAddress }, {});
//       const res = createMockResponse();

//       await governanceController.getUserProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposals,
//       });
//       expect(mockGetUserProposals).toHaveBeenCalledWith(userAddress);
//     });

//     it("returns error when service fails", async () => {
//       mockGetUserProposals.mockRejectedValueOnce(new Error("Service error"));

//       const req = createMockRequest({ address: "0x" + "1".repeat(40) }, {});
//       const res = createMockResponse();

//       await governanceController.getUserProposals(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to fetch user proposals",
//       });
//     });
//   });

//   describe("getUserVotes", () => {
//     it("returns error when user address is missing", async () => {
//       const req = createMockRequest({}, {});
//       const res = createMockResponse();

//       await governanceController.getUserVotes(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(400);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "User address is required",
//       });
//       expect(mockGetUserVotes).not.toHaveBeenCalled();
//     });

//     it("returns user votes successfully", async () => {
//       const userAddress = "0x" + "1".repeat(40);
//       const mockProposals = [
//         { id: 1, title: "Voted Proposal 1", hasVoted: true },
//         { id: 3, title: "Voted Proposal 3", hasVoted: true },
//       ];

//       mockGetUserVotes.mockResolvedValueOnce(mockProposals);

//       const req = createMockRequest({ address: userAddress }, {});
//       const res = createMockResponse();

//       await governanceController.getUserVotes(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data: mockProposals,
//       });
//       expect(mockGetUserVotes).toHaveBeenCalledWith(userAddress);
//     });

//     it("returns error when service fails", async () => {
//       mockGetUserVotes.mockRejectedValueOnce(new Error("Service error"));

//       const req = createMockRequest({ address: "0x" + "1".repeat(40) }, {});
//       const res = createMockResponse();

//       await governanceController.getUserVotes(req as Request, res as Response);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         error: "Failed to fetch user votes",
//       });
//     });
//   });
// });

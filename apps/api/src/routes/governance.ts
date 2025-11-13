/**
 * Governance Routes
 * API endpoints for DAO governance operations
 */

import { Router } from "express";
import {
  getStats,
  getAllProposals,
  getProposal,
  createProposal,
  vote,
  addComment,
  getComments,
  getUserProposals,
  getUserVotes,
  finalizeProposal,
} from "@/controllers/governanceController";

const router = Router();

/**
 * @swagger
 * /governance/stats:
 *   get:
 *     summary: Get platform-wide governance statistics
 *     description: Retrieves statistics about governance activity including total proposals, votes, and participation metrics
 *     tags: [Governance]
 *     responses:
 *       200:
 *         description: Governance statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProposals:
 *                       type: number
 *                       description: Total number of proposals created
 *                       example: 42
 *                     activeProposals:
 *                       type: number
 *                       description: Number of currently active proposals
 *                       example: 5
 *                     totalVotes:
 *                       type: number
 *                       description: Total number of votes cast across all proposals
 *                       example: 156
 *                     uniqueVoters:
 *                       type: number
 *                       description: Number of unique addresses that have voted
 *                       example: 38
 *                     avgParticipation:
 *                       type: number
 *                       description: Average participation rate (0-100)
 *                       example: 67.5
 *                     votingPower:
 *                       type: number
 *                       description: Total voting power in the system
 *                       example: 1000000
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch governance statistics
 */
router.get("/stats", getStats);

/**
 * @swagger
 * /governance/proposals:
 *   get:
 *     summary: Get all proposals
 *     description: Retrieves a list of all governance proposals with optional user voting status
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: userAddress
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Optional wallet address to check if user has voted on proposals
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Implement new privacy features"
 *                       description:
 *                         type: string
 *                         example: "Proposal to add enhanced privacy controls"
 *                       category:
 *                         type: number
 *                         enum: [0, 1, 2, 3, 4]
 *                         description: "0: Economics, 1: Privacy, 2: Governance, 3: Policy, 4: Other"
 *                         example: 1
 *                       proposer:
 *                         type: string
 *                         pattern: '^0x[a-fA-F0-9]{40}$'
 *                         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                       startTime:
 *                         type: number
 *                         description: Unix timestamp
 *                         example: 1699564800
 *                       endTime:
 *                         type: number
 *                         description: Unix timestamp
 *                         example: 1699651200
 *                       votesFor:
 *                         type: number
 *                         example: 150
 *                       votesAgainst:
 *                         type: number
 *                         example: 50
 *                       totalVoters:
 *                         type: number
 *                         example: 200
 *                       state:
 *                         type: number
 *                         enum: [0, 1, 2]
 *                         description: "0: Active, 1: Passed, 2: Failed"
 *                         example: 0
 *                       timeRemaining:
 *                         type: number
 *                         description: Seconds remaining in voting period
 *                         example: 86400
 *                       hasVoted:
 *                         type: boolean
 *                         description: Whether the user has voted (only if userAddress provided)
 *                         example: true
 *                       userVote:
 *                         type: number
 *                         enum: [0, 1, 2]
 *                         description: "0: None, 1: For, 2: Against (only if userAddress provided)"
 *                         example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch proposals
 */
router.get("/proposals", getAllProposals);

/**
 * @swagger
 * /governance/proposals/{id}:
 *   get:
 *     summary: Get a single proposal by ID
 *     description: Retrieves detailed information about a specific governance proposal
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *         example: 1
 *       - in: query
 *         name: userAddress
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Optional wallet address to check if user has voted
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - in: query
 *         name: includeComments
 *         schema:
 *           type: boolean
 *         description: Include comments in the response (default: false). For large threads prefer using /proposals/{id}/comments
 *         example: false
 *     responses:
 *       200:
 *         description: Proposal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Implement new privacy features"
 *                     description:
 *                       type: string
 *                       example: "Proposal to add enhanced privacy controls"
 *                     category:
 *                       type: number
 *                       enum: [0, 1, 2, 3, 4]
 *                       description: "0: Economics, 1: Privacy, 2: Governance, 3: Policy, 4: Other"
 *                       example: 1
 *                     proposer:
 *                       type: string
 *                       pattern: '^0x[a-fA-F0-9]{40}$'
 *                       example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                     startTime:
 *                       type: number
 *                       description: Unix timestamp
 *                       example: 1699564800
 *                     endTime:
 *                       type: number
 *                       description: Unix timestamp
 *                       example: 1699651200
 *                     votesFor:
 *                       type: number
 *                       example: 150
 *                     votesAgainst:
 *                       type: number
 *                       example: 50
 *                     totalVoters:
 *                       type: number
 *                       example: 200
 *                     state:
 *                       type: number
 *                       enum: [0, 1, 2]
 *                       description: "0: Active, 1: Passed, 2: Failed"
 *                       example: 0
 *                     timeRemaining:
 *                       type: number
 *                       description: Seconds remaining in voting period
 *                       example: 86400
 *                     hasVoted:
 *                       type: boolean
 *                       description: Whether the user has voted (only if userAddress provided)
 *                       example: true
 *                     userVote:
 *                       type: number
 *                       enum: [0, 1, 2]
 *                       description: "0: None, 1: For, 2: Against (only if userAddress provided)"
 *                       example: 1
 *       400:
 *         description: Bad request - Invalid proposal ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid proposal ID
 *       404:
 *         description: Proposal not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Proposal not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch proposal
 */
router.get("/proposals/:id", getProposal);

/**
 * @swagger
 * /governance/proposals:
 *   post:
 *     summary: Create a new governance proposal
 *     description: Creates a new proposal for community voting
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - walletAddress
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the proposal
 *                 example: "Implement new privacy features"
 *               description:
 *                 type: string
 *                 description: Detailed description of the proposal
 *                 example: "This proposal aims to add enhanced privacy controls for users"
 *               category:
 *                 type: number
 *                 enum: [0, 1, 2, 3, 4]
 *                 description: "0: Economics, 1: Privacy, 2: Governance, 3: Policy, 4: Other"
 *                 example: 1
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Wallet address of the proposer
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposalId:
 *                       type: number
 *                       example: 42
 *                 transactionHash:
 *                   type: string
 *                   example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Title is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to create proposal
 */
router.post("/proposals", createProposal);

/**
 * @swagger
 * /governance/proposals/{id}/vote:
 *   post:
 *     summary: Vote on a proposal
 *     description: Cast a vote (For/Against) on an active proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choice
 *               - walletAddress
 *             properties:
 *               choice:
 *                 type: number
 *                 enum: [1, 2, 3]
 *                 description: "1: For, 2: Against, 3"
 *                 example: 1
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Wallet address of the voter
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: Vote cast successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposalId:
 *                       type: number
 *                       example: 1
 *                     choice:
 *                       type: number
 *                       enum: [1, 2, 3]
 *                       example: 1
 *                 transactionHash:
 *                   type: string
 *                   example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *       400:
 *         description: Bad request - Invalid input or voting not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid vote choice (must be 1: For, 2: Against)"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to cast vote
 */
router.post("/proposals/:id/vote", vote);

/**
 * @swagger
 * /governance/proposals/{id}/comment:
 *   post:
 *     summary: Add a comment to a proposal
 *     description: Add a discussion comment to a specific proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commenterAddress
 *               - content
 *             properties:
 *               commenterAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Wallet address of the commenter
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *               content:
 *                 type: string
 *                 description: Comment text
 *                 example: "I support this proposal because..."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                           example: 1
 *                         proposalId:
 *                           type: number
 *                           example: 1
 *                         commenterAddress:
 *                           type: string
 *                           example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                         content:
 *                           type: string
 *                           example: "I support this"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-11-13T12:34:56.000Z"
 *       400:
 *         description: Bad request - Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/proposals/:id/comment", addComment);

/**
 * @swagger
 * /governance/proposals/{id}/comments:
 *   get:
 *     summary: Get paginated comments for a proposal
 *     description: Retrieve comments for a proposal with pagination support
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (1-indexed)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of comments per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           proposalId:
 *                             type: number
 *                           commenterAddress:
 *                             type: string
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
       500:
         description: Internal server error
 */
router.get("/proposals/:id/comments", getComments);

/**
 * @swagger
 * /governance/proposals/{id}/finalize:
 *   post:
 *     summary: Finalize a proposal after voting period ends
 *     description: Finalizes a proposal and determines its outcome (Passed/Failed) after the voting period has ended
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Proposal finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposalId:
 *                       type: number
 *                       example: 1
 *                 transactionHash:
 *                   type: string
 *                   example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *       400:
 *         description: Bad request - Invalid proposal ID or cannot finalize
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid proposal ID
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to finalize proposal
 */
router.post("/proposals/:id/finalize", finalizeProposal);

/**
 * @swagger
 * /governance/users/{address}/proposals:
 *   get:
 *     summary: Get proposals created by a specific user
 *     description: Retrieves all proposals created by a specific wallet address
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Wallet address of the user
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: User proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Implement new privacy features"
 *                       description:
 *                         type: string
 *                         example: "Proposal to add enhanced privacy controls"
 *                       category:
 *                         type: number
 *                         enum: [0, 1, 2, 3, 4]
 *                         example: 1
 *                       proposer:
 *                         type: string
 *                         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                       startTime:
 *                         type: number
 *                         example: 1699564800
 *                       endTime:
 *                         type: number
 *                         example: 1699651200
 *                       votesFor:
 *                         type: number
 *                         example: 150
 *                       votesAgainst:
 *                         type: number
 *                         example: 50
 *                       totalVoters:
 *                         type: number
 *                         example: 200
 *                       state:
 *                         type: number
 *                         enum: [0, 1, 2]
 *                         example: 0
 *       400:
 *         description: Bad request - Invalid wallet address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User address is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch user proposals
 */
router.get("/users/:address/proposals", getUserProposals);

/**
 * @swagger
 * /governance/users/{address}/votes:
 *   get:
 *     summary: Get proposals where a user has voted
 *     description: Retrieves all proposals that a specific wallet address has voted on
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Wallet address of the user
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: User votes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Implement new privacy features"
 *                       description:
 *                         type: string
 *                         example: "Proposal to add enhanced privacy controls"
 *                       category:
 *                         type: number
 *                         enum: [0, 1, 2, 3, 4]
 *                         example: 1
 *                       proposer:
 *                         type: string
 *                         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                       startTime:
 *                         type: number
 *                         example: 1699564800
 *                       endTime:
 *                         type: number
 *                         example: 1699651200
 *                       votesFor:
 *                         type: number
 *                         example: 150
 *                       votesAgainst:
 *                         type: number
 *                         example: 50
 *                       totalVoters:
 *                         type: number
 *                         example: 200
 *                       state:
 *                         type: number
 *                         enum: [0, 1, 2]
 *                         example: 0
 *                       hasVoted:
 *                         type: boolean
 *                         example: true
 *                       userVote:
 *                         type: number
 *                         enum: [0, 1, 2]
 *                         description: "0: None, 1: For, 2: Against"
 *                         example: 1
 *       400:
 *         description: Bad request - Invalid wallet address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User address is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch user votes
 */
router.get("/users/:address/votes", getUserVotes);

export default router;
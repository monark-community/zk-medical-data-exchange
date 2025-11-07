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
  getUserProposals,
  getUserVotes,
  finalizeProposal,
} from "@/controllers/governanceController";

const router = Router();

/**
 * @route   GET /governance/stats
 * @desc    Get platform-wide governance statistics
 * @access  Public
 */
router.get("/stats", getStats);

/**
 * @route   GET /governance/proposals
 * @desc    Get all proposals
 * @query   userAddress - Optional wallet address to check if user voted
 * @access  Public
 */
router.get("/proposals", getAllProposals);

/**
 * @route   GET /governance/proposals/:id
 * @desc    Get a single proposal by ID
 * @query   userAddress - Optional wallet address to check if user voted
 * @access  Public
 */
router.get("/proposals/:id", getProposal);

/**
 * @route   POST /governance/proposals
 * @desc    Create a new governance proposal
 * @body    { title, description, category, walletAddress }
 * @access  Authenticated (requires session token)
 */
router.post("/proposals", createProposal);

/**
 * @route   POST /governance/proposals/:id/vote
 * @desc    Vote on a proposal
 * @body    { choice, walletAddress }
 * @access  Authenticated (requires session token)
 */
router.post("/proposals/:id/vote", vote);

/**
 * @route   POST /governance/proposals/:id/finalize
 * @desc    Finalize a proposal after voting period ends
 * @access  Public (anyone can finalize)
 */
router.post("/proposals/:id/finalize", finalizeProposal);

/**
 * @route   GET /governance/users/:address/proposals
 * @desc    Get proposals created by a specific user
 * @access  Public
 */
router.get("/users/:address/proposals", getUserProposals);

/**
 * @route   GET /governance/users/:address/votes
 * @desc    Get proposals where a user has voted
 * @access  Public
 */
router.get("/users/:address/votes", getUserVotes);

export default router;
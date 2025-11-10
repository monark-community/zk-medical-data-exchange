import type { Request, Response } from "express";
import {
  governanceService,
  ProposalCategory,
  VoteChoice,
  type CreateProposalParams,
  type VoteParams,
} from "@/services/governanceService";
import logger from "@/utils/logger";

export async function getStats(req: Request, res: Response) {
  try {
    logger.info("GET /governance/stats");

    const stats = await governanceService.getPlatformStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to get governance stats");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch governance statistics",
    });
  }
}

export async function getAllProposals(req: Request, res: Response) {
  try {
    const userAddress = req.query.userAddress as string | undefined;

    logger.info({ userAddress }, "GET /governance/proposals");

    const proposals = await governanceService.getAllProposals(userAddress);
    logger.info({ count: proposals.length }, "Fetched proposals"); // empty
    return res.status(200).json({
      success: true,
      data: proposals,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to get proposals");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch proposals",
    });
  }
}

export async function getProposal(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Proposal ID is required",
      });
    }

    const proposalId = parseInt(req.params.id);
    const userAddress = req.query.userAddress as string | undefined;

    if (isNaN(proposalId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid proposal ID",
      });
    }

    logger.info({ proposalId, userAddress }, "GET /governance/proposals/:id");

    const proposal = await governanceService.getProposal(proposalId, userAddress);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: "Proposal not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to get proposal");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch proposal",
    });
  }
}

export async function createProposal(req: Request, res: Response) {
  try {
    const { title, description, category, walletAddress } = req.body;

    logger.info({ title, category, walletAddress }, "POST /governance/proposals");

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    if (category === undefined || category < 0 || category > 3) {
      return res.status(400).json({
        success: false,
        error: "Invalid category (must be 0-3: Economics, Privacy, Governance, Policy)",
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    const params: CreateProposalParams = {
      title: title.trim(),
      description: description.trim(),
      category: category as ProposalCategory,
      walletAddress,
    };

    const result = await governanceService.createProposal(params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to create proposal",
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      transactionHash: result.transactionHash,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to create proposal");
    return res.status(500).json({
      success: false,
      error: "Failed to create proposal",
    });
  }
}

export async function vote(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Proposal ID is required",
      });
    }

    const proposalId = parseInt(req.params.id);
    const { choice, walletAddress } = req.body;

    logger.info({ proposalId, choice, walletAddress }, "POST /governance/proposals/:id/vote");

    if (isNaN(proposalId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid proposal ID",
      });
    }

    if (choice === undefined || choice < 1 || choice > 3) {
      return res.status(400).json({
        success: false,
        error: "Invalid vote choice (must be 1: For, 2: Against, 3: Abstain)",
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    const params: VoteParams = {
      proposalId,
      choice: choice as VoteChoice,
      walletAddress,
    };

    const result = await governanceService.vote(params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to cast vote",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      transactionHash: result.transactionHash,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to cast vote");
    return res.status(500).json({
      success: false,
      error: "Failed to cast vote",
    });
  }
}

export async function getUserProposals(req: Request, res: Response) {
  try {
    const userAddress = req.params.address;

    logger.info({ userAddress }, "GET /governance/users/:address/proposals");

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: "User address is required",
      });
    }

    const proposals = await governanceService.getUserProposals(userAddress);

    return res.status(200).json({
      success: true,
      data: proposals,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to get user proposals");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user proposals",
    });
  }
}

export async function getUserVotes(req: Request, res: Response) {
  try {
    const userAddress = req.params.address;

    logger.info({ userAddress }, "GET /governance/users/:address/votes");

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: "User address is required",
      });
    }

    const proposals = await governanceService.getUserVotes(userAddress);

    return res.status(200).json({
      success: true,
      data: proposals,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to get user votes");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user votes",
    });
  }
}

export async function finalizeProposal(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: "Proposal ID is required",
      });
    }

    const proposalId = parseInt(req.params.id);

    logger.info({ proposalId }, "POST /governance/proposals/:id/finalize");

    if (isNaN(proposalId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid proposal ID",
      });
    }

    const result = await governanceService.finalizeProposal(proposalId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to finalize proposal",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      transactionHash: result.transactionHash,
    });
  } catch (error: any) {
    logger.error({ error }, "Failed to finalize proposal");
    return res.status(500).json({
      success: false,
      error: "Failed to finalize proposal",
    });
  }
}

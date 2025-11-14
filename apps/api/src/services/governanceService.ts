/**
 * Governance Service for API Backend
 * Handles GovernanceDAO contract interactions on Sepolia testnet
 */

import { createWalletClient, createPublicClient, http, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "@supabase/supabase-js";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { GOVERNANCE_DAO_ABI } from "@/contracts/generated";
import { TABLES } from "@/constants/db";
import type { SupabaseClient } from "@supabase/supabase-js";

const { USERS, PROPOSALS, PROPOSAL_VOTES, PROPOSAL_COMMENTS } = TABLES;

// Enums matching Solidity contract
/* eslint-disable no-unused-vars */
export enum VoteChoice {
  None = 0,
  For = 1,
  Against = 2,
}

export enum ProposalState {
  Active = 0,
  Passed = 1,
  Failed = 2,
}

export enum ProposalCategory {
  Economics = 0,
  Privacy = 1,
  Governance = 2,
  Policy = 3,
  Other = 4,
}
/* eslint-enable no-unused-vars */

export interface Proposal {
  id: number;
  title: string;
  description: string;
  category: ProposalCategory;
  proposer: string;
  startTime: number;
  endTime: number;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  state: ProposalState;
  timeRemaining?: number;
  hasVoted?: boolean;
  userVote?: VoteChoice;
  // Array of comments for the proposal (discussion flow)
  comments?: Comment[];
}

export interface Comment {
  id: number;
  proposalId: number;
  commenterAddress: string;
  content: string;
  createdAt: string; // ISO string
}

export interface AddCommentParams {
  proposalId: number;
  commenterAddress: string;
  content: string;
}

export interface AddCommentResult {
  comment: Comment;
}

export interface PlatformStats {
  totalProposals: number;
  activeProposals: number;
  totalVotes: number;
  uniqueVoters: number;
  avgParticipation: number;
  votingPower: number;
}

export interface CreateProposalParams {
  title: string;
  description: string;
  category: ProposalCategory;
  walletAddress: string;
  duration: number;
}

export interface VoteParams {
  proposalId: number;
  choice: VoteChoice;
  walletAddress: string;
}

export interface CreateProposalResult {
  proposalId: number;
}

export interface VoteResult {
  proposalId: number;
  choice: VoteChoice;
}

export interface FinalizeProposalResult {
  proposalId: number;
}

export interface GovernanceResult<T = unknown> {
  success: boolean;
  data?: T;
  transactionHash?: string;
  error?: string;
}

class GovernanceService {
  private walletClient: any;
  private publicClient: any;
  private account: any;
  private contractAddress: string;
  private supabase: SupabaseClient;

  constructor() {
    const privateKey = Config.SEPOLIA_PRIVATE_KEY;
    const rpcUrl = Config.SEPOLIA_RPC_URL;
    this.contractAddress = Config.GOVERNANCE_DAO_ADDRESS;

    if (!privateKey) {
      throw new Error("SEPOLIA_PRIVATE_KEY environment variable is required");
    }

    if (!this.contractAddress) {
      throw new Error("GOVERNANCE_DAO_ADDRESS environment variable is required");
    }

    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

    if (formattedPrivateKey.length !== 66) {
      throw new Error("Invalid SEPOLIA_PRIVATE_KEY format (must be 64 hex characters)");
    }

    try {
      this.account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    } catch (error) {
      logger.error({ error }, "Failed to create account from private key");
      throw new Error("Invalid private key format");
    }

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    this.supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    logger.info(
      {
        contractAddress: this.contractAddress,
        account: this.account.address,
      },
      "GovernanceService initialized"
    );
  }

  async createProposal(
    params: CreateProposalParams
  ): Promise<GovernanceResult<CreateProposalResult>> {
    try {
      logger.info({ params }, "Creating proposal");

      if (!params.title || params.title.length === 0) {
        return { success: false, error: "Title cannot be empty" };
      }

      if (!params.description || params.description.length === 0) {
        return { success: false, error: "Description cannot be empty" };
      }

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "createProposal",
        args: [params.title, params.description, params.category, BigInt(params.duration), params.walletAddress],
      });

      logger.info({ hash }, "Proposal creation transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Proposal created on blockchain successfully");

      let proposalId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: GOVERNANCE_DAO_ABI,
            data: log.data,
            topics: log.topics,
          });
          logger.info({ decoded }, "Decoded event log");
          if (decoded.eventName === "ProposalCreated" && decoded.args) {
            proposalId = Number((decoded.args as any).proposalId);
            break;
          }
        } catch {
          // Ignore logs that don't match
        }
      }

      if (proposalId === undefined) {
        logger.error({ hash }, "Could not extract proposal ID from blockchain event");
        return {
          success: false,
          error: "Proposal created on blockchain but ID extraction failed",
        };
      }

      // Fetch complete proposal data from blockchain
      const blockchainProposal = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      });
      logger.info({ blockchainProposal }, "DEBUG getProposal result");

      // Save to database for fast queries
      const { error: dbError } = await this.supabase.from(PROPOSALS!.name).insert({
        id: proposalId,
        title: params.title,
        description: params.description,
        category: params.category,
        proposer: params.walletAddress,
        start_time: Number(blockchainProposal.startTime),
        end_time: Number(blockchainProposal.endTime),
        votes_for: Number(blockchainProposal.votesFor),
        votes_against: Number(blockchainProposal.votesAgainst),
        total_voters: Number(blockchainProposal.totalVoters),
        state: Number(blockchainProposal.state),
        deployment_tx_hash: hash,
        chain_id: 11155111, // Sepolia
      });

      if (dbError) {
        logger.error({ error: dbError, proposalId }, "Failed to save proposal to database");
        // Don't fail the request - blockchain is source of truth
        // Database is just a cache, can be synced later
      } else {
        logger.info({ proposalId }, "Proposal saved to database successfully");
      }

      return {
        success: true,
        data: { proposalId },
        transactionHash: hash,
      };
    } catch (error: any) {
      logger.error({ error, params }, "Failed to create proposal");
      return {
        success: false,
        error: error.message || "Failed to create proposal",
      };
    }
  }

  async vote(params: VoteParams): Promise<GovernanceResult<VoteResult>> {
    try {
      logger.info({ params }, "Casting vote on blockchain");

      if (params.choice === VoteChoice.None) {
        return { success: false, error: "Invalid vote choice" };
      }

      // Check if already voted (from database)
      const { data: existingVote } = await this.supabase
        .from(PROPOSAL_VOTES!.name)
        .select("*")
        .eq(PROPOSAL_VOTES!.columns.proposalId!, params.proposalId)
        .eq(PROPOSAL_VOTES!.columns.voterAddress!, params.walletAddress)
        .single();

      if (existingVote) {
        return { success: false, error: "Already voted on this proposal" };
      }

      // Submit vote to blockchain
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "vote",
        args: [BigInt(params.proposalId), params.choice, params.walletAddress],
      });

      logger.info({ hash }, "Vote transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Vote cast on blockchain successfully");

      // Update database cache with new vote counts
      // Get updated proposal data from blockchain
      const proposalData = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getProposal",
        args: [BigInt(params.proposalId)],
      });

      // Update proposal vote counts in database
      const { error: updateError } = await this.supabase
        .from(PROPOSALS!.name)
        .update({
          votes_for: Number((proposalData as any).votesFor ?? (proposalData as any)[7]),
          votes_against: Number((proposalData as any).votesAgainst ?? (proposalData as any)[8]),
          total_voters: Number((proposalData as any).totalVoters ?? (proposalData as any)[9]),
          state: Number((proposalData as any).state ?? (proposalData as any)[10]),
        })
        .eq(PROPOSALS!.columns.id!, params.proposalId);

      if (updateError) {
        logger.error(
          { error: updateError, proposalId: params.proposalId },
          "Failed to update proposal vote counts in database"
        );
      }

      // Record individual vote in database
      const { data: dbProposal } = await this.supabase
        .from(PROPOSALS!.name)
        .select("id")
        .eq(PROPOSALS!.columns.id!, params.proposalId)
        .single();

      if (dbProposal) {
        const { error: voteError } = await this.supabase.from(PROPOSAL_VOTES!.name).insert({
          proposal_id: dbProposal.id,
          voter_address: params.walletAddress,
          choice: params.choice,
          vote_tx_hash: hash,
        });

        if (voteError) {
          logger.error(
            { error: voteError, proposalId: params.proposalId },
            "Failed to save vote to database"
          );
        } else {
          logger.info(
            { proposalId: params.proposalId, voter: params.walletAddress },
            "Vote saved to database successfully"
          );
        }
      }

      return {
        success: true,
        data: { proposalId: params.proposalId, choice: params.choice },
        transactionHash: hash,
      };
    } catch (error: any) {
      logger.error({ error, params }, "Failed to cast vote");
      return {
        success: false,
        error: error.message || "Failed to cast vote",
      };
    }
  }

  /**
   * Add a comment to a proposal (stored in database cache)
   */
  async addComment(params: AddCommentParams): Promise<GovernanceResult<AddCommentResult>> {
    try {
      logger.info({ params }, "Adding comment to proposal");

      if (!params.content || params.content.trim().length === 0) {
        return { success: false, error: "Comment content cannot be empty" };
      }

      // ensure proposal exists in DB (or on-chain fallback)
      const { data: dbProposal } = await this.supabase
        .from(PROPOSALS!.name)
        .select("id")
        .eq(PROPOSALS!.columns.id!, params.proposalId)
        .single();

      if (!dbProposal) {
        // If not in DB, check blockchain quickly
        const onChain = await this.publicClient
          .readContract({
            address: this.contractAddress as `0x${string}`,
            abi: GOVERNANCE_DAO_ABI,
            functionName: "getProposal",
            args: [BigInt(params.proposalId)],
          })
          .catch(() => null);

        if (!onChain) {
          return { success: false, error: "Proposal not found" };
        }
      }

      const now = new Date().toISOString();

      const { data: inserted, error } = await this.supabase
        .from(PROPOSAL_COMMENTS!.name)
        .insert({
          proposal_id: params.proposalId,
          commenter_address: params.commenterAddress,
          content: params.content.trim(),
          created_at: now,
        })
        .select("*")
        .single();

      if (error) {
        logger.error({ error, params }, "Failed to insert comment into database");
        return { success: false, error: "Failed to save comment" };
      }

      const comment: Comment = {
        id: inserted.id,
        proposalId: inserted.proposal_id,
        commenterAddress: inserted.commenter_address,
        content: inserted.content,
        createdAt: inserted.created_at,
      };

      return { success: true, data: { comment } };
    } catch (error: any) {
      logger.error({ error, params }, "Failed to add comment");
      return { success: false, error: error.message || "Failed to add comment" };
    }
  }

  async getProposal(
    proposalId: number,
    userAddress?: string,
    includeComments = false
  ): Promise<Proposal | null> {
    try {
      logger.info({ proposalId, userAddress }, "Fetching proposal from database");

      // Fetch from database (fast)
      const { data: dbProposal, error: dbError } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*")
        .eq(PROPOSALS!.columns.id!, proposalId)
        .single();

      if (dbError || !dbProposal) {
        logger.warn(
          { error: dbError, proposalId },
          "Proposal not found in database, falling back to blockchain"
        );

        // Fallback to blockchain if not in database
        return await this.getProposalFromBlockchain(proposalId, userAddress);
      }

      // Calculate time remaining
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = Math.max(0, dbProposal.end_time - now);

      const proposal: Proposal = {
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        category: dbProposal.category,
        proposer: dbProposal.proposer,
        startTime: dbProposal.start_time,
        endTime: dbProposal.end_time,
        votesFor: dbProposal.votes_for,
        votesAgainst: dbProposal.votes_against,
        totalVoters: dbProposal.total_voters,
        state: dbProposal.state,
        timeRemaining,
      };

      // Step 2: Check if user has voted (from database for speed)
      if (userAddress) {
        const { data: userVote } = await this.supabase
          .from(PROPOSAL_VOTES!.name)
          .select("*")
          .eq(PROPOSAL_VOTES!.columns.proposalId!, dbProposal.id)
          .eq(PROPOSAL_VOTES!.columns.voterAddress!, userAddress)
          .single();

        if (userVote) {
          proposal.hasVoted = true;
          proposal.userVote = userVote.choice;
        } else {
          proposal.hasVoted = false;
        }
      }

      // Optionally fetch comments for this proposal from the comments table
      if (includeComments) {
        try {
          const { data: commentsData, error: commentsError } = await this.supabase
            .from(PROPOSAL_COMMENTS!.name)
            .select("id, proposal_id, commenter_address, content, created_at")
            .eq(PROPOSAL_COMMENTS!.columns.proposalId!, dbProposal.id)
            .order(PROPOSAL_COMMENTS!.columns.createdAt!, { ascending: true });

          if (!commentsError && commentsData) {
            proposal.comments = commentsData.map((c: any) => ({
              id: c.id,
              proposalId: c.proposal_id,
              commenterAddress: c.commenter_address,
              content: c.content,
              createdAt: c.created_at,
            }));
          } else {
            proposal.comments = [];
          }
        } catch (err) {
          logger.error({ err }, "Failed to include comment");
          proposal.comments = [];
        }
      }

      return proposal;
    } catch (error: any) {
      logger.error({ error, proposalId }, "Failed to fetch proposal");
      return null;
    }
  }

  /**
   * Fetch proposal directly from blockchain (fallback method)
   */
  private async getProposalFromBlockchain(
    proposalId: number,
    userAddress?: string
  ): Promise<Proposal | null> {
    try {
      const proposalData = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      });

      const proposal: Proposal = {
        id: Number((proposalData as any).id ?? (proposalData as any)[0]),
        title: (proposalData as any).title ?? (proposalData as any)[1],
        description: (proposalData as any).description ?? (proposalData as any)[2],
        category: Number(
          (proposalData as any).category ?? (proposalData as any)[3]
        ) as ProposalCategory,
        proposer: (proposalData as any).proposer ?? (proposalData as any)[4],
        startTime: Number((proposalData as any).startTime ?? (proposalData as any)[5]),
        endTime: Number((proposalData as any).endTime ?? (proposalData as any)[6]),
        votesFor: Number((proposalData as any).votesFor ?? (proposalData as any)[7]),
        votesAgainst: Number((proposalData as any).votesAgainst ?? (proposalData as any)[8]),
        totalVoters: Number((proposalData as any).totalVoters ?? (proposalData as any)[9]),
        state: Number((proposalData as any).state ?? (proposalData as any)[10]) as ProposalState,
      };

      const timeRemaining = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getTimeRemaining",
        args: [BigInt(proposalId)],
      });
      proposal.timeRemaining = Number(timeRemaining);

      if (userAddress) {
        const hasVoted = await this.publicClient.readContract({
          address: this.contractAddress as `0x${string}`,
          abi: GOVERNANCE_DAO_ABI,
          functionName: "getHasVoted",
          args: [BigInt(proposalId), userAddress as `0x${string}`],
        });

        proposal.hasVoted = hasVoted;

        if (hasVoted) {
          const vote = await this.publicClient.readContract({
            address: this.contractAddress as `0x${string}`,
            abi: GOVERNANCE_DAO_ABI,
            functionName: "getVote",
            args: [BigInt(proposalId), userAddress as `0x${string}`],
          });
          proposal.userVote = Number(vote) as VoteChoice;
        }
      }

      return proposal;
    } catch (error: any) {
      logger.error({ error, proposalId }, "Failed to fetch proposal from blockchain");
      return null;
    }
  }

  async getAllProposals(userAddress?: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching all proposals from database");

      // Fetch all proposals from database (fast, no blockchain calls)
      const { data: dbProposals, error: dbError } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*")
        .order(PROPOSALS!.columns.createdAt!, { ascending: false });

      if (dbError) {
        logger.error({ error: dbError }, "Failed to fetch proposals from database");
        return [];
      }

      if (!dbProposals || dbProposals.length === 0) {
        logger.info("No proposals found in database");
        return [];
      }

      const now = Math.floor(Date.now() / 1000);
      const proposals: Proposal[] = dbProposals.map((dbProposal: any) => ({
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        category: dbProposal.category,
        proposer: dbProposal.proposer,
        startTime: dbProposal.start_time,
        endTime: dbProposal.end_time,
        votesFor: dbProposal.votes_for,
        votesAgainst: dbProposal.votes_against,
        totalVoters: dbProposal.total_voters,
        state: dbProposal.state,
        timeRemaining: Math.max(0, dbProposal.end_time - now),
      }));

      // If user address provided, check their votes
      if (userAddress) {
        const { data: userVotes } = await this.supabase
          .from(PROPOSAL_VOTES!.name)
          .select("proposal_id, choice")
          .eq(PROPOSAL_VOTES!.columns.voterAddress!, userAddress);

        if (userVotes && userVotes.length > 0) {
          const voteMap = new Map(userVotes.map((v: any) => [v.proposal_id, v.choice]));

          for (const proposal of proposals) {
            const dbProposal = dbProposals.find((p: any) => p.id === proposal.id);
            if (dbProposal && voteMap.has(dbProposal.id)) {
              proposal.hasVoted = true;
              proposal.userVote = voteMap.get(dbProposal.id) as VoteChoice;
            } else {
              proposal.hasVoted = false;
            }
          }
        } else {
          proposals.forEach((p) => (p.hasVoted = false));
        }
      }

      logger.info({ count: proposals.length }, "Fetched all proposals from database");

      return proposals;
    } catch (error: any) {
      logger.error({ error }, "Failed to fetch all proposals");
      return [];
    }
  }

  async getUserProposals(userAddress: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching user proposals from database");

      // Fetch user's proposals from database
      const { data: dbProposals, error: dbError } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*")
        .eq(PROPOSALS!.columns.proposer!, userAddress)
        .order(PROPOSALS!.columns.createdAt!, { ascending: false });

      if (dbError) {
        logger.error(
          { error: dbError, userAddress },
          "Failed to fetch user proposals from database"
        );
        return [];
      }

      if (!dbProposals || dbProposals.length === 0) {
        return [];
      }

      const now = Math.floor(Date.now() / 1000);
      const proposals: Proposal[] = dbProposals.map((dbProposal: any) => ({
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        category: dbProposal.category,
        proposer: dbProposal.proposer,
        startTime: dbProposal.start_time,
        endTime: dbProposal.end_time,
        votesFor: dbProposal.votes_for,
        votesAgainst: dbProposal.votes_against,
        totalVoters: dbProposal.total_voters,
        state: dbProposal.state,
        timeRemaining: Math.max(0, dbProposal.end_time - now),
      }));

      // Fetch user votes for all proposals if userAddress provided
      if (userAddress) {
        const proposalIds = dbProposals.map((p: any) => p.id);
        const { data: userVotes } = await this.supabase
          .from(PROPOSAL_VOTES!.name)
          .select("proposal_id, choice")
          .eq(PROPOSAL_VOTES!.columns.voterAddress!, userAddress)
          .in(PROPOSAL_VOTES!.columns.proposalId!, proposalIds);

        if (userVotes && userVotes.length > 0) {
          const voteMap = new Map(userVotes.map((v: any) => [v.proposal_id, v.choice]));

          for (const proposal of proposals) {
            if (voteMap.has(proposal.id)) {
              proposal.hasVoted = true;
              proposal.userVote = voteMap.get(proposal.id) as VoteChoice;
            } else {
              proposal.hasVoted = false;
            }
          }
        } else {
          proposals.forEach((p) => (p.hasVoted = false));
        }
      }
      logger.info({ count: proposals.length }, "Fetched user proposals from database");

      return proposals;
    } catch (error: any) {
      logger.error({ error, userAddress }, "Failed to fetch user proposals");
      return [];
    }
  }

  async getUserVotes(userAddress: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching user votes from database");

      // Fetch user's votes
      const { data: userVotes, error: votesError } = await this.supabase
        .from(PROPOSAL_VOTES!.name)
        .select("proposal_id, choice")
        .eq(PROPOSAL_VOTES!.columns.voterAddress!, userAddress);

      if (votesError) {
        logger.error(
          { error: votesError, userAddress },
          "Failed to fetch user votes from database"
        );
        return [];
      }

      if (!userVotes || userVotes.length === 0) {
        return [];
      }

      const proposalIds = userVotes.map((vote: any) => vote.proposal_id);

      const { data: dbProposals, error: proposalsError } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*")
        .in(PROPOSALS!.columns.id!, proposalIds);

      if (proposalsError || !dbProposals) {
        logger.error(
          { error: proposalsError, userAddress },
          "Failed to fetch proposals from database"
        );
        return [];
      }

      const voteMap = new Map(userVotes.map((v: any) => [v.proposal_id, v.choice]));

      const now = Math.floor(Date.now() / 1000);
      const proposals: Proposal[] = dbProposals.map((dbProposal: any) => ({
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        category: dbProposal.category,
        proposer: dbProposal.proposer,
        startTime: dbProposal.start_time,
        endTime: dbProposal.end_time,
        votesFor: dbProposal.votes_for,
        votesAgainst: dbProposal.votes_against,
        totalVoters: dbProposal.total_voters,
        state: dbProposal.state,
        timeRemaining: Math.max(0, dbProposal.end_time - now),
        hasVoted: true,
        userVote: voteMap.get(dbProposal.id) as VoteChoice,
      }));

      logger.info({ count: proposals.length }, "Fetched user votes from database");

      return proposals;
    } catch (error: any) {
      logger.error({ error, userAddress }, "Failed to fetch user votes");
      return [];
    }
  }

  /**
   * Get comments for a proposal with pagination
   */
  async getComments(
    proposalId: number,
    page = 1,
    limit = 20
  ): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
    try {
      const offset = Math.max(0, (page - 1) * limit);

      const { data: commentsData, error } = await this.supabase
        .from(PROPOSAL_COMMENTS!.name)
        .select("id, proposal_id, commenter_address, content, created_at", { count: "exact" })
        .eq(PROPOSAL_COMMENTS!.columns.proposalId!, proposalId)
        .order(PROPOSAL_COMMENTS!.columns.createdAt!, { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error(
          { error, proposalId, page, limit },
          "Failed to fetch proposal comments from database"
        );
        return { comments: [], total: 0, page, limit };
      }

      const total = (commentsData as any)?.length ?? 0;
      const comments: Comment[] = ((commentsData as any) || []).map((c: any) => ({
        id: c.id,
        proposalId: c.proposal_id,
        commenterAddress: c.commenter_address,
        content: c.content,
        createdAt: c.created_at,
      }));

      return { comments, total, page, limit };
    } catch (error: any) {
      logger.error({ error, proposalId, page, limit }, "Failed to get comments");
      return { comments: [], total: 0, page, limit };
    }
  }

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      logger.info("Fetching platform stats from database");

      // Get proposal counts from database
      const { count: totalProposals } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*", { count: "exact", head: true });

      const { count: activeProposals } = await this.supabase
        .from(PROPOSALS!.name)
        .select("*", { count: "exact", head: true })
        .eq(PROPOSALS!.columns.state!, ProposalState.Active);

      // Get total votes from database
      const { count: totalVotes } = await this.supabase
        .from(PROPOSAL_VOTES!.name)
        .select("*", { count: "exact", head: true });

      // Get total registered users from database
      const { count: totalUsers, error: countError } = await this.supabase
        .from(USERS!.name || "users")
        .select("*", { count: "exact", head: true });

      if (countError) {
        logger.error({ error: countError }, "Failed to fetch user count from database");
      }

      // Calculate average participation: (avg votes per proposal / total users) * 100
      const avgVotesPerProposal =
        (totalProposals || 0) > 0 ? (totalVotes || 0) / (totalProposals || 1) : 0;
      const avgParticipation =
        totalUsers && totalUsers > 0 ? Math.min(100, (avgVotesPerProposal / totalUsers) * 100) : 0;

      // uniqueVoters = total registered users on the platform (who can vote)
      const uniqueVoters = totalUsers || 0;

      const platformStats: PlatformStats = {
        totalProposals: totalProposals || 0,
        activeProposals: activeProposals || 0,
        totalVotes: totalVotes || 0,
        uniqueVoters,
        avgParticipation: Math.round(avgParticipation * 100) / 100, // Round to 2 decimals
        votingPower: totalVotes || 0,
      };

      logger.info({ platformStats }, "Fetched platform stats from database");

      return platformStats;
    } catch (error: any) {
      logger.error({ error }, "Failed to fetch platform stats");
      return {
        totalProposals: 0,
        activeProposals: 0,
        totalVotes: 0,
        uniqueVoters: 0,
        avgParticipation: 0,
        votingPower: 0,
      };
    }
  }

  async finalizeProposal(proposalId: number): Promise<GovernanceResult<FinalizeProposalResult>> {
    try {
      logger.info({ proposalId }, "Finalizing proposal on blockchain");

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "finalizeProposal",
        args: [BigInt(proposalId)],
      });

      logger.info({ hash }, "Finalize transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Proposal finalized on blockchain successfully");

      const proposalData = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      });

      const { error: updateError } = await this.supabase
        .from(PROPOSALS!.name)
        .update({
          state: Number((proposalData as any).state ?? (proposalData as any)[10]),
        })
        .eq(PROPOSALS!.columns.id!, proposalId);

      if (updateError) {
        logger.error(
          { error: updateError, proposalId },
          "Failed to update finalized proposal in database"
        );
      } else {
        logger.info({ proposalId }, "Finalized proposal updated in database");
      }

      return {
        success: true,
        data: { proposalId },
        transactionHash: hash,
      };
    } catch (error: any) {
      logger.error({ error, proposalId }, "Failed to finalize proposal");
      return {
        success: false,
        error: error.message || "Failed to finalize proposal",
      };
    }
  }
}

export const governanceService = new GovernanceService();

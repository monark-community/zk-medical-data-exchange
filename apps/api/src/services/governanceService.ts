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

const { USERS } = TABLES;

// Enums matching Solidity contract
export enum VoteChoice {
  None = 0,
  For = 1,
  Against = 2,
}

export enum ProposalState {
  Active = 0, 
  Passed = 1,
  Failed = 2,
  Executed = 3
}

export enum ProposalCategory {
  Economics = 0,
  Privacy = 1,
  Governance = 2,
  Policy = 3,
  Other = 4,
}

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
  executed: boolean;
  state: ProposalState;
  timeRemaining?: number;
  hasVoted?: boolean;
  userVote?: VoteChoice;
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

    logger.info(
      {
        contractAddress: this.contractAddress,
        account: this.account.address,
      },
      "GovernanceService initialized"
    );
  }

  async createProposal(params: CreateProposalParams): Promise<GovernanceResult<CreateProposalResult>> {
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
        args: [params.title, params.description, params.category],
      });

      logger.info({ hash }, "Proposal creation transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Proposal created successfully");

      let proposalId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: GOVERNANCE_DAO_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "ProposalCreated" && decoded.args) {
            proposalId = Number((decoded.args as any).proposalId);
            break;
          }
        } catch {
            // Ignore logs that don't match
        }
      }

      return {
        success: true,
        data: { proposalId: proposalId ?? 0 },
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
      logger.info({ params }, "Casting vote");

      if (params.choice === VoteChoice.None) {
        return { success: false, error: "Invalid vote choice" };
      }

      const hasVoted = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getHasVoted",
        args: [BigInt(params.proposalId), params.walletAddress as `0x${string}`],
      });

      if (hasVoted) {
        return { success: false, error: "Already voted on this proposal" };
      }

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "vote",
        args: [BigInt(params.proposalId), params.choice],
      });

      logger.info({ hash }, "Vote transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Vote cast successfully");

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

  async getProposal(proposalId: number, userAddress?: string): Promise<Proposal | null> {
    try {
      logger.info({ proposalId, userAddress }, "Fetching proposal");

      const proposalData = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      });

      const proposal: Proposal = {
        id: Number(proposalData[0]),
        title: proposalData[1],
        description: proposalData[2],
        category: Number(proposalData[3]) as ProposalCategory,
        proposer: proposalData[4],
        startTime: Number(proposalData[5]),
        endTime: Number(proposalData[6]),
        votesFor: Number(proposalData[7]),
        votesAgainst: Number(proposalData[8]),
        totalVoters: Number(proposalData[9]),
        executed: proposalData[10],
        state: Number(proposalData[11]) as ProposalState,
      };

      const timeRemaining = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getTimeRemaining",
        args: [BigInt(proposalId)],
      });
      proposal.timeRemaining = Number(timeRemaining);

      // If user address provided, check if they voted
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
      logger.error({ error, proposalId }, "Failed to fetch proposal");
      return null;
    }
  }

  async getAllProposals(userAddress?: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching all proposals");

      const proposalCount = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "proposalCount",
      });

      const count = Number(proposalCount);
      const proposals: Proposal[] = [];

      const proposalPromises = Array.from({ length: count }, (_, i) =>
        this.getProposal(i, userAddress)
      );

      const results = await Promise.all(proposalPromises);

      for (const proposal of results) {
        if (proposal) {
          proposals.push(proposal);
        }
      }

      proposals.sort((a, b) => b.id - a.id);

      logger.info({ count: proposals.length }, "Fetched all proposals");

      return proposals;
    } catch (error: any) {
      logger.error({ error }, "Failed to fetch all proposals");
      return [];
    }
  }

  async getUserProposals(userAddress: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching user proposals");

      const proposalIds = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getUserProposals",
        args: [userAddress as `0x${string}`],
      });

      const proposals: Proposal[] = [];

      for (const id of proposalIds) {
        const proposal = await this.getProposal(Number(id), userAddress);
        if (proposal) {
          proposals.push(proposal);
        }
      }

      logger.info({ count: proposals.length }, "Fetched user proposals");

      return proposals;
    } catch (error: any) {
      logger.error({ error, userAddress }, "Failed to fetch user proposals");
      return [];
    }
  }

  async getUserVotes(userAddress: string): Promise<Proposal[]> {
    try {
      logger.info({ userAddress }, "Fetching user votes");

      const proposalIds = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getUserVotes",
        args: [userAddress as `0x${string}`],
      });

      const proposals: Proposal[] = [];

      for (const id of proposalIds) {
        const proposal = await this.getProposal(Number(id), userAddress);
        if (proposal) {
          proposals.push(proposal);
        }
      }

      logger.info({ count: proposals.length }, "Fetched user votes");

      return proposals;
    } catch (error: any) {
      logger.error({ error, userAddress }, "Failed to fetch user votes");
      return [];
    }
  }

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      logger.info("Fetching platform stats");

      // Get blockchain stats
      const stats = await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "getPlatformStats",
      });

      const totalProposals = Number(stats[0]);
      const activeProposals = Number(stats[1]);
      const totalVotes = Number(stats[2]);

      // Get total registered users from database
      const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY, {
        auth: { persistSession: false },
      });

      const { count: totalUsers, error: countError } = await supabase
        .from(USERS?.name || "users")
        .select("*", { count: "exact", head: true });

      if (countError) {
        logger.error({ error: countError }, "Failed to fetch user count from database");
      }

      // Calculate average participation: (avg votes per proposal / total users) * 100
      const avgVotesPerProposal = totalProposals > 0 ? totalVotes / totalProposals : 0;
      const avgParticipation =
        totalUsers && totalUsers > 0
          ? Math.min(100, (avgVotesPerProposal / totalUsers) * 100)
          : 0;

      // Use database user count as active voters (registered users who can vote)
      // Note: The smart contract doesn't track unique voters across proposals,
      // so we use total registered users as a proxy for potential active voters
      const uniqueVoters = totalUsers || 0;

      const platformStats: PlatformStats = {
        totalProposals,
        activeProposals,
        totalVotes,
        uniqueVoters,
        avgParticipation: Math.round(avgParticipation * 100) / 100, // Round to 2 decimals
        votingPower: totalVotes,
      };

      logger.info({ platformStats }, "Fetched platform stats");

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
      logger.info({ proposalId }, "Finalizing proposal");

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress as `0x${string}`,
        abi: GOVERNANCE_DAO_ABI,
        functionName: "finalizeProposal",
        args: [BigInt(proposalId)],
      });

      logger.info({ hash }, "Finalize transaction sent");

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      logger.info({ receipt }, "Proposal finalized successfully");

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
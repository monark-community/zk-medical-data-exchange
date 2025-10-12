/* eslint-disable no-unused-vars */
/**
 * Audit Service for comprehensive action tracking
 * Integrates with blockchain AuditTrail contract and database logging
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { AUDIT_TRAIL_ABI } from "@/contracts";

export enum UserProfile {
  RESEARCHER,
  DATA_SELLER,
  ADMIN,
  COMMON,
}

export enum ActionType {
  // COMMON
  USER_AUTHENTICATION, // Login/logout events
  PROPOSAL_CREATION, // Governance proposal created
  VOTE_CAST, // Vote cast on proposal
  PROPOSAL_REMOVAL, // Governance proposal removed
  // RESEARCHER ACTIONS
  STUDY_CREATION, // New study created
  STUDY_STATUS_CHANGE, // Study activated/deactivated
  STUDY_AGGREGATED_DATA_ACCESS, // Access to aggregated study data
  PERMISSION_CHANGE, // Permission granted/revoked
  // DATA SELLER ACTIONS
  STUDY_PARTICIPATION, // Patient joins study
  STUDY_CONSENT_REVOKED, // Patient revokes consent
  DATA_UPLOAD, // Data uploaded to vault
  DATA_ACCESS, // Data accessed/viewed
  DATA_DELETED, // Data deleted from vault
  // ADMIN
  ADMIN_ACTION, // Administrative actions
  SYSTEM_CONFIG, // System configuration changes
}

export interface AuditLogEntry {
  user: string;
  userProfile: UserProfile; // Added profile
  actionType: ActionType;
  resource: string;
  action: string;
  success: boolean;
  metadata?: Record<string, any>;
  sensitiveData?: Record<string, any>; // For hashing
  timestamp?: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor() {
    const privateKey = Config.SEPOLIA_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("SEPOLIA_PRIVATE_KEY required for audit logging");
    }

    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    this.account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });

    logger.info(
      {
        auditLogger: this.account.address,
        auditContract: Config.AUDIT_TRAIL_ADDRESS,
      },
      "Audit service initialized"
    );
  }

  /**
   * Log an action to blockchain and database
   */
  async logAction(
    entry: AuditLogEntry
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Create data hash for privacy
      const dataHash = this.createDataHash(entry.sensitiveData || {});

      // Prepare metadata
      const metadata = {
        timestamp: entry.timestamp || new Date(),
        sessionId: entry.sessionId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        ...entry.metadata,
      };

      //   // Log to database first (faster, for immediate access)
      //   await this.logToDatabase(entry, dataHash, metadata);

      // Log to blockchain (for immutability)
      const txHash = await this.logToBlockchain(
        entry.user,
        entry.userProfile,
        entry.actionType,
        entry.resource,
        entry.action,
        dataHash,
        entry.success,
        JSON.stringify(metadata)
      );

      logger.info(
        {
          user: entry.user,
          action: entry.action,
          resource: entry.resource,
          txHash,
        },
        "Action logged successfully"
      );

      return { success: true, txHash };
    } catch (error) {
      logger.error(
        {
          error,
          entry,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        "Failed to log audit action"
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown audit logging error",
      };
    }
  }

  /**
   * Log to blockchain for immutability
   */
  private async logToBlockchain(
    user: string,
    userProfile: UserProfile,
    actionType: ActionType,
    resource: string,
    action: string,
    dataHash: string,
    success: boolean,
    metadata: string
  ): Promise<string> {
    const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

    const txHash = await this.walletClient.writeContract({
      address: auditTrailAddress as `0x${string}`,
      abi: AUDIT_TRAIL_ABI,
      functionName: "logAction",
      args: [
        user as `0x${string}`,
        userProfile,
        actionType,
        resource,
        action,
        dataHash as `0x${string}`,
        success,
        metadata,
      ],
    });

    // Wait for confirmation
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    return txHash;
  }

  /**
   * Create privacy-preserving hash of sensitive data
   */
  private createDataHash(sensitiveData: Record<string, any>): string {
    if (Object.keys(sensitiveData).length === 0) {
      return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    const dataString = JSON.stringify(sensitiveData, Object.keys(sensitiveData).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);

    // Create hash (using a simple implementation - in production use proper crypto)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i]!; // Non-null assertion since we know i is within bounds
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex string padded to 32 bytes
    const hashHex = Math.abs(hash).toString(16).padStart(64, "0");
    return `0x${hashHex}`;
  }

  /**
   * Get user action history
   */
  async getUserActions(userAddress: string, limit: number = 100): Promise<any[]> {
    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

      const actions = await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserActions",
        args: [userAddress as `0x${string}`],
      });

      const latestActions = actions.slice(-limit); // Get latest actions

      // Convert BigInt values to numbers for JSON serialization
      return this.convertBigIntToNumber(latestActions);
    } catch (error) {
      logger.error({ error, userAddress }, "Failed to get user actions");
      return [];
    }
  }

  /**
   * Get latest actions for a user with specific profile
   */
  async getUserLatestActions(
    userAddress: string,
    userProfile: UserProfile,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

      const actions = await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserLatestActions",
        args: [userAddress as `0x${string}`, userProfile, BigInt(limit)],
      });

      return actions;
    } catch (error) {
      logger.error({ error, userAddress, userProfile }, "Failed to get user latest actions");
      return [];
    }
  }

  /**
   * Get audit record details by ID
   */
  async getAuditRecord(recordId: number): Promise<any | null> {
    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

      const record = await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "auditRecords",
        args: [BigInt(recordId)],
      });

      // Convert BigInt values to numbers for JSON serialization
      return this.convertBigIntToNumber(record);
    } catch (error) {
      logger.error({ error, recordId }, "Failed to get audit record");
      return null;
    }
  }

  /**
   * Convenience methods for common actions
   */
  async logAuthentication(userAddress: string, success: boolean, metadata?: Record<string, any>) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON, // Authentication is common to all profiles
      actionType: ActionType.USER_AUTHENTICATION,
      resource: "auth",
      action: success ? "login_success" : "login_failed",
      success,
      metadata,
    });
  }

  async logStudyCreation(
    userAddress: string,
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_CREATION,
      resource: `study_${studyId}`,
      action: "create_study",
      success,
      metadata,
    });
  }

  async logStudyParticipation(
    userAddress: string,
    studyId: string,
    success: boolean,
    proofData?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_PARTICIPATION,
      resource: `study_${studyId}`,
      action: "join_study",
      success,
      sensitiveData: proofData, // Will be hashed for privacy
    });
  }

  async logStudyDeletion(
    userAddress: string,
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_STATUS_CHANGE,
      resource: `study_${studyId}`,
      action: "delete_study",
      success,
      metadata,
    });
  }

  async logAdminAction(
    userAddress: string,
    resource: string,
    action: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.ADMIN,
      actionType: ActionType.ADMIN_ACTION,
      resource,
      action,
      success,
      metadata,
    });
  }

  /**
   * Get user actions for a specific profile, including COMMON actions
   * Uses the new contract function that combines profile-specific and common actions
   */
  async getUserActionsForProfile(
    userAddress: string,
    userProfile: UserProfile,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

      const actions = await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserActionsForProfile",
        args: [userAddress as `0x${string}`, userProfile],
      });

      // Since the contract returns in ascending order (oldest first),
      // we reverse to get latest first and take the last N records
      const actionsArray = Array.from(actions).reverse();
      const limitedActions = actionsArray.slice(0, limit);

      // Convert BigInt values to numbers for JSON serialization
      return this.convertBigIntToNumber(limitedActions);
    } catch (error) {
      logger.error({ error, userAddress, userProfile }, "Failed to get user actions for profile");
      return [];
    }
  }

  /**
   * Get paginated user actions for a specific profile, including COMMON actions
   */
  async getUserActionsForProfilePaginated(
    userAddress: string,
    userProfile: UserProfile,
    offset: number = 0,
    limit: number = 100,
    latestFirst: boolean = true
  ): Promise<{ records: any[]; total: number }> {
    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

      // First, get the array of record IDs and total count
      const [recordIds, total] = await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserActionsForProfilePaginated",
        args: [
          userAddress as `0x${string}`,
          userProfile,
          BigInt(offset),
          BigInt(limit),
          latestFirst,
        ],
      });

      // Then, fetch full details for each record ID
      const recordDetailsPromises = recordIds.map(async (recordId: bigint) => {
        try {
          const recordData = await this.publicClient.readContract({
            address: auditTrailAddress,
            abi: AUDIT_TRAIL_ABI,
            functionName: "auditRecords",
            args: [recordId],
          });

          // Map the tuple result to our expected interface
          const [
            timestamp,
            blockNumber,
            user,
            userProfile,
            actionType,
            resource,
            action,
            dataHash,
            success,
            metadata,
          ] = recordData as [
            bigint,
            bigint,
            string,
            number,
            number,
            string,
            string,
            string,
            boolean,
            string
          ];

          return {
            id: Number(recordId),
            timestamp: Number(timestamp),
            blockNumber: Number(blockNumber),
            user,
            userProfile,
            actionType,
            resource,
            action,
            dataHash,
            success,
            metadata,
          };
        } catch (error) {
          logger.error({ error, recordId }, "Failed to fetch individual record details");
          return null;
        }
      });

      // Wait for all record details and filter out any failed fetches
      const recordDetails = await Promise.all(recordDetailsPromises);
      const validRecords = recordDetails.filter((record) => record !== null);

      // Convert BigInt values to numbers for JSON serialization
      const serializedRecords = this.convertBigIntToNumber(validRecords);

      return { records: serializedRecords, total: Number(total) };
    } catch (error) {
      logger.error(
        { error, userAddress, userProfile, offset, limit },
        "Failed to get user actions for profile paginated"
      );
      return { records: [], total: 0 };
    }
  }

  /**
   * Check if an action type should be logged as COMMON
   */
  static getProfileForActionType(actionType: ActionType, defaultProfile: UserProfile): UserProfile {
    // Common actions that should be available across all profiles
    if (
      actionType === ActionType.USER_AUTHENTICATION ||
      actionType === ActionType.PROPOSAL_CREATION ||
      actionType === ActionType.VOTE_CAST ||
      actionType === ActionType.PROPOSAL_REMOVAL
    ) {
      return UserProfile.COMMON;
    }
    return defaultProfile;
  }

  /**
   * Enhanced logAction method that automatically determines if action should be COMMON
   */
  async logActionWithProfileDetection(
    entry: Omit<AuditLogEntry, "userProfile"> & { suggestedProfile: UserProfile }
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const actualProfile = AuditService.getProfileForActionType(
      entry.actionType,
      entry.suggestedProfile
    );

    return this.logAction({
      ...entry,
      userProfile: actualProfile,
    });
  }

  /**
   * Convert BigInt values to numbers for JSON serialization
   */
  private convertBigIntToNumber(data: any): any {
    if (typeof data === "bigint") {
      return Number(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.convertBigIntToNumber(item));
    }

    if (data && typeof data === "object") {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }

    return data;
  }
}

// Export singleton instance
export const auditService = new AuditService();

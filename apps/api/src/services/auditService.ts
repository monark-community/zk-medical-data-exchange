/* eslint-disable no-unused-vars */
import { createPublicClient, createWalletClient, http } from "viem";
import type { PublicClient, WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { AUDIT_TRAIL_ABI } from "@/contracts";
import { UserProfile } from "@zk-medical/shared";
import {
  buildPriorityFeeOverrides,
  waitForReceiptWithTimeout,
  retryFastTransaction,
  FAST_TX_MAX_RETRIES,
  FAST_TX_TIMEOUT_MS,
  FAST_TX_POLL_INTERVAL_MS,
} from "@/utils/fastTx";

export enum ActionType {
  USER_AUTHENTICATION,
  PROPOSAL_CREATION,
  VOTE_CAST,
  PROPOSAL_REMOVAL,
  USERNAME_CHANGE,
  STUDY_CREATION,
  STUDY_STATUS_CHANGE,
  STUDY_AGGREGATED_DATA_ACCESS,
  PERMISSION_CHANGE,
  STUDY_PARTICIPATION,
  STUDY_CONSENT_REVOKED,
  STUDY_CONSENT_GRANTED,
  DATA_UPLOAD,
  DATA_ACCESS,
  DATA_DELETED,
  ADMIN_ACTION,
  SYSTEM_CONFIG,
  SENT_COMPENSATION,
  RECEIVED_COMPENSATION,
}
export interface AuditLogEntry {
  user: string;
  userProfile: UserProfile;
  actionType: ActionType;
  resource: string;
  action: string;
  success: boolean;
  metadata?: Record<string, any>;
  sensitiveData?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  private publicClient!: PublicClient;
  private walletClient!: WalletClient;
  private account!: PrivateKeyAccount;
  private transactionQueue: Promise<any> = Promise.resolve();

  constructor() {
    // In test mode, skip blockchain initialization
    if (process.env.NODE_ENV === "test") {
      return;
    }

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

  async logAction(
    entry: AuditLogEntry
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    this.transactionQueue = this.transactionQueue
      .then(async () => {
        return this.processLogAction(entry);
      })
      .catch(async (error) => {
        logger.error({ error }, "Error in transaction queue, continuing with next transaction");
        return this.processLogAction(entry);
      });

    return this.transactionQueue;
  }

  async logActionForParticipants(
    participants: string[],
    entry: Omit<AuditLogEntry, "user">
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    this.transactionQueue = this.transactionQueue
      .then(async () => {
        return this.processLogActionForParticipants(participants, entry);
      })
      .catch(async (error) => {
        logger.error(
          { error },
          "Error in transaction queue for participants, continuing with next transaction"
        );
        return this.processLogActionForParticipants(participants, entry);
      });

    return this.transactionQueue;
  }

  private async processLogActionForParticipants(
    participants: string[],
    entry: Omit<AuditLogEntry, "user">
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (participants.length === 0) {
        return { success: false, error: "No participants provided" };
      }

      if (participants.length > 100) {
        return { success: false, error: "Too many participants, maximum 100 allowed" };
      }

      const dataHash = this.createDataHash(entry.sensitiveData || {});

      const metadata = {
        timestamp: entry.timestamp || new Date(),
        sessionId: entry.sessionId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        ...entry.metadata,
      };

      const txHash = await this.logToBlockchainForParticipants(
        participants,
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
          participants,
          action: entry.action,
          resource: entry.resource,
          txHash,
        },
        "Action logged successfully for participants"
      );

      return { success: true, txHash };
    } catch (error) {
      logger.error(
        {
          error,
          participants,
          entry,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        "Failed to log audit action for participants"
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown audit logging error",
      };
    }
  }

  private async processLogAction(
    entry: AuditLogEntry
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const dataHash = this.createDataHash(entry.sensitiveData || {});

      const metadata = {
        timestamp: entry.timestamp || new Date(),
        sessionId: entry.sessionId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        ...entry.metadata,
      };

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
    // In test mode, return a mock transaction hash
    if (process.env.NODE_ENV === "test") {
      return "0x" + "0".repeat(64);
    }

    const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

    return retryFastTransaction(
      async () => {
        const feeOverrides = await buildPriorityFeeOverrides(this.publicClient);
        const submittedAt = Date.now();
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
          account: this.account,
          chain: sepolia,
          ...feeOverrides,
        });

        const receipt = await waitForReceiptWithTimeout(
          this.publicClient,
          txHash,
          "Audit trail log",
          FAST_TX_TIMEOUT_MS,
          FAST_TX_POLL_INTERVAL_MS,
          {
            submittedAt,
            priorityFee: feeOverrides.maxPriorityFeePerGas,
            maxFee: feeOverrides.maxFeePerGas,
            context: "Audit trail log",
          }
        );

        logger.info(
          {
            user,
            action,
            txHash,
          },
          "Blockchain transaction confirmed"
        );

        return txHash;
      },
      "Audit trail logging",
      FAST_TX_MAX_RETRIES
    );
  }

  private async logToBlockchainForParticipants(
    participants: string[],
    userProfile: UserProfile,
    actionType: ActionType,
    resource: string,
    action: string,
    dataHash: string,
    success: boolean,
    metadata: string
  ): Promise<string> {
    const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;

    return retryFastTransaction(
      async () => {
        const feeOverrides = await buildPriorityFeeOverrides(this.publicClient);
        const submittedAt = Date.now();
        const txHash = await this.walletClient.writeContract({
          address: auditTrailAddress as `0x${string}`,
          abi: AUDIT_TRAIL_ABI,
          functionName: "logActionForParticipants",
          args: [
            participants as `0x${string}`[],
            userProfile,
            actionType,
            resource,
            action,
            dataHash as `0x${string}`,
            success,
            metadata,
          ],
          account: this.account,
          chain: sepolia,
          ...feeOverrides,
        });

        const receipt = await waitForReceiptWithTimeout(
          this.publicClient,
          txHash,
          "Audit trail participant log",
          FAST_TX_TIMEOUT_MS,
          FAST_TX_POLL_INTERVAL_MS,
          {
            submittedAt,
            priorityFee: feeOverrides.maxPriorityFeePerGas,
            maxFee: feeOverrides.maxFeePerGas,
            context: "Audit trail participant log",
          }
        );

        logger.info(
          {
            participants,
            action,
            txHash,
          },
          "Blockchain transaction confirmed for participants"
        );

        return txHash;
      },
      "Audit trail participant logging",
      FAST_TX_MAX_RETRIES
    );
  }

  private createDataHash(sensitiveData: Record<string, any>): string {
    if (Object.keys(sensitiveData).length === 0) {
      return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    const dataString = JSON.stringify(sensitiveData, Object.keys(sensitiveData).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i]!;
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const hashHex = Math.abs(hash).toString(16).padStart(64, "0");
    return `0x${hashHex}`;
  }

  async getUserActions(userAddress: string, limit: number = 100): Promise<any[]> {
    // In test mode, return empty array
    if (process.env.NODE_ENV === "test") {
      return [];
    }

    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS as `0x${string}`;

      const actions = (await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserActions",
        args: [userAddress as `0x${string}`],
      })) as bigint[];

      const latestActions = actions.slice(-limit);

      return this.convertBigIntToNumber(latestActions);
    } catch (error) {
      logger.error({ error, userAddress }, "Failed to get user actions");
      return [];
    }
  }

  async getUserLatestActions(
    userAddress: string,
    userProfile: UserProfile,
    limit: number = 100
  ): Promise<any[]> {
    // In test mode, return empty array
    if (process.env.NODE_ENV === "test") {
      return [];
    }

    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS as `0x${string}`;

      const actions = (await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserLatestActions",
        args: [userAddress as `0x${string}`, userProfile, BigInt(limit)],
      })) as bigint[];

      return this.convertBigIntToNumber(actions);
    } catch (error) {
      logger.error({ error, userAddress, userProfile }, "Failed to get user latest actions");
      return [];
    }
  }

  async getAuditRecord(recordId: number): Promise<any | null> {
    // In test mode, return null
    if (process.env.NODE_ENV === "test") {
      return null;
    }

    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS as `0x${string}`;

      const record = (await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "auditRecords",
        args: [BigInt(recordId)],
      })) as any;

      return this.convertBigIntToNumber(record);
    } catch (error) {
      logger.error({ error, recordId }, "Failed to get audit record");
      return null;
    }
  }

  async logAuthentication(userAddress: string, success: boolean, metadata?: Record<string, any>) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON,
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
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_PARTICIPATION,
      resource: `study_${studyId}`,
      action: "join_study",
      success,
      metadata,
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

  async logStudyCompletion(
    creatorAddress: string,
    participantsAddresses: string[],
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const creatorResult = await this.logAction({
      user: creatorAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_STATUS_CHANGE,
      resource: `study_${studyId}`,
      action: "complete_study",
      success,
      metadata: {
        ...metadata,
        participantCount: participantsAddresses.length,
        role: "creator",
      },
    });

    const participantsResult = await this.logActionForParticipants(participantsAddresses, {
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_STATUS_CHANGE,
      resource: `study_${studyId}`,
      action: "study_completed",
      success,
      metadata: {
        ...metadata,
        creator: creatorAddress,
        role: "participant",
      },
    });

    return {
      creatorLog: creatorResult,
      participantsLog: participantsResult,
    };
  }

  async logCompensationSent(
    creatorAddress: string,
    participantsAddresses: string[],
    studyId: string,
    success: boolean,
    totalMoney: number,
    metadata?: Record<string, any>
  ) {
    const creatorResult = await this.logAction({
      user: creatorAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.SENT_COMPENSATION,
      resource: `compensation_study_${studyId}`,
      action: "send_compensation",
      success,
      metadata: {
        ...metadata,
        studyId,
        totalMoney,
        role: "creator",
      },
    });

    const participantsResult = await this.logActionForParticipants(participantsAddresses, {
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.RECEIVED_COMPENSATION,
      resource: `compensation_study_${studyId}`,
      action: "receive_compensation",
      success,
      metadata: {
        ...metadata,
        studyId,
        studyCreator: creatorAddress,
        totalMoney: totalMoney / participantsAddresses.length,
        role: "participant",
      },
    });

    return {
      creatorLog: creatorResult,
      participantsLog: participantsResult,
    };
  }

  async logStudyDataAccess(
    creatorAddress: string,
    participantsAddresses: string[],
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const creatorResult = await this.logAction({
      user: creatorAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_AGGREGATED_DATA_ACCESS,
      resource: `study_${studyId}_aggregated_data`,
      action: "access_aggregated_data",
      success,
      metadata: {
        ...metadata,
        role: "creator",
      },
    });

    const participantsResult = await this.logActionForParticipants(participantsAddresses, {
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_AGGREGATED_DATA_ACCESS,
      resource: `study_${studyId}_aggregated_data`,
      action: "access_aggregated_data",
      success,
      metadata: {
        ...metadata,
        creator: creatorAddress,
        role: "participant",
        message: "Your data was included in aggregated results accessed by the study creator.",
        studyId: studyId,
      },
    });

    return {
      creatorLog: creatorResult,
      participantsLog: participantsResult,
    };
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

  async logDataUpload(
    userAddress: string,
    resourceType: string,
    encryptedCID: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      resourceType,
      encryptedCID,
      uploadTimestamp: Date.now(),
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_UPLOAD,
      resource: resourceType,
      action: `Upload file: ${resourceType}`,
      success,
      metadata: enrichedMetadata,
    });
  }

  async logDataDeletion(
    userAddress: string,
    resourceType: string,
    encryptedCID: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      resourceType,
      encryptedCID,
      deletionTimestamp: Date.now(),
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_DELETED,
      resource: resourceType,
      action: `Delete file: ${resourceType}`,
      success,
      metadata: enrichedMetadata,
    });
  }

  async logDataAccess(
    userAddress: string,
    encryptedCID: string,
    accessType: "view" | "download",
    success: boolean,
    resourceType?: string,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      encryptedCID,
      accessType,
      resourceType,
      accessTimestamp: Date.now(),
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_ACCESS,
      resource: resourceType || accessType,
      action: `${accessType === "view" ? "View" : "Download"} file: ${resourceType || "data"}`,
      success,
      metadata: enrichedMetadata,
    });
  }

  async getUserActionsForProfile(
    userAddress: string,
    userProfile: UserProfile,
    limit: number = 100
  ): Promise<any[]> {
    // In test mode, return empty array
    if (process.env.NODE_ENV === "test") {
      return [];
    }

    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS as `0x${string}`;

      const actions = (await this.publicClient.readContract({
        address: auditTrailAddress,
        abi: AUDIT_TRAIL_ABI,
        functionName: "getUserActionsForProfile",
        args: [userAddress as `0x${string}`, userProfile],
      })) as bigint[];

      const actionsArray = [...actions].reverse();
      const limitedActions = actionsArray.slice(0, limit);

      return this.convertBigIntToNumber(limitedActions);
    } catch (error) {
      logger.error({ error, userAddress, userProfile }, "Failed to get user actions for profile");
      return [];
    }
  }

  async getUserActionsForProfilePaginated(
    userAddress: string,
    userProfile: UserProfile,
    offset: number = 0,
    limit: number = 100,
    latestFirst: boolean = true
  ): Promise<{ records: any[]; total: number }> {
    // In test mode, return empty result
    if (process.env.NODE_ENV === "test") {
      return { records: [], total: 0 };
    }

    try {
      const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS as `0x${string}`;

      const result = (await this.publicClient.readContract({
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
      })) as [bigint[], bigint];

      const [recordIds, total] = result;

      const recordDetailsPromises = recordIds.map(async (recordId: bigint) => {
        try {
          const recordData = (await this.publicClient.readContract({
            address: auditTrailAddress,
            abi: AUDIT_TRAIL_ABI,
            functionName: "auditRecords",
            args: [recordId],
          })) as any;

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

      const recordDetails = await Promise.all(recordDetailsPromises);
      const validRecords = recordDetails.filter((record) => record !== null);

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

  static getProfileForActionType(actionType: ActionType, defaultProfile: UserProfile): UserProfile {
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

  async logConsentRevocation(
    userAddress: string,
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_CONSENT_REVOKED,
      resource: `study_${studyId}`,
      action: "revoke_consent",
      success,
      metadata,
    });
  }

  async logConsentGranting(
    userAddress: string,
    studyId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_CONSENT_GRANTED,
      resource: `study_${studyId}`,
      action: "grant_consent",
      success,
      metadata,
    });
  }

  async logUsernameChange(
    userAddress: string,
    oldUsername: string,
    newUsername: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      oldUsername,
      newUsername,
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON,
      actionType: ActionType.USERNAME_CHANGE,
      resource: "user_profile",
      action: "change_username",
      success,
      metadata: enrichedMetadata,
    });
  }

  async logProposalCreation(
    userAddress: string,
    proposalId: string,
    proposalType: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      proposalType,
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON,
      actionType: ActionType.PROPOSAL_CREATION,
      resource: `proposal_${proposalId}`,
      action: "create_proposal",
      success,
      metadata: enrichedMetadata,
    });
  }

  async logVoteCast(
    userAddress: string,
    proposalId: string,
    vote: "yes" | "no" | "abstain",
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      vote,
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON,
      actionType: ActionType.VOTE_CAST,
      resource: `proposal_${proposalId}`,
      action: "cast_vote",
      success,
      metadata: enrichedMetadata,
    });
  }

  async logProposalRemoval(
    userAddress: string,
    proposalId: string,
    reason: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const enrichedMetadata = {
      reason,
      ...metadata,
    };

    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.COMMON,
      actionType: ActionType.PROPOSAL_REMOVAL,
      resource: `proposal_${proposalId}`,
      action: "remove_proposal",
      success,
      metadata: enrichedMetadata,
    });
  }


  private static failedApplicationCache = new Map<string, { timestamp: number; reason: string }>();


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

export { AuditService };
export const auditService = new AuditService();

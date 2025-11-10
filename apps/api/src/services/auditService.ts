import { createPublicClient, createWalletClient, http } from "viem";
import type { PublicClient, WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { AUDIT_TRAIL_ABI } from "@/contracts";
import { UserProfile } from "@zk-medical/shared";

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
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: PrivateKeyAccount;
  private transactionQueue: Promise<any> = Promise.resolve();

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
    const auditTrailAddress = Config.AUDIT_TRAIL_ADDRESS;
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(
          {
            user,
            action,
            attempt,
            maxRetries,
          },
          "Attempting blockchain transaction"
        );

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
        });

        const receipt = await Promise.race([
          this.publicClient.waitForTransactionReceipt({
            hash: txHash,
            timeout: 60000,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)
          ),
        ]);

        logger.info(
          {
            user,
            action,
            txHash,
            attempt,
          },
          "Blockchain transaction confirmed"
        );

        return txHash;
      } catch (error: any) {
        lastError = error;
        logger.warn(
          {
            error: error.message,
            user,
            action,
            attempt,
            maxRetries,
          },
          `Blockchain transaction attempt ${attempt} failed`
        );

        if (
          error.message?.includes("insufficient funds") ||
          error.message?.includes("gas required exceeds allowance")
        ) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Blockchain transaction failed after ${maxRetries} attempts: ${lastError.message}`
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
    proofData?: Record<string, any>
  ) {
    return this.logAction({
      user: userAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_PARTICIPATION,
      resource: `study_${studyId}`,
      action: "join_study",
      success,
      sensitiveData: proofData,
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

export const auditService = new AuditService();

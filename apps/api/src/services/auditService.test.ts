import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { AuditService, ActionType } from "./auditService";
import { UserProfile } from "@zk-medical/shared";

process.env.NODE_ENV = "test";

afterEach(() => {
  mock.restore(); // resets ALL mocks
});

// Mock viem
const mockPublicClient = {
  readContract: mock(() => Promise.resolve([])),
  waitForTransactionReceipt: mock(() => Promise.resolve({ status: "success" })),
  estimateFeesPerGas: mock(() =>
    Promise.resolve({
      maxFeePerGas: 25n * 10n ** 9n,
      maxPriorityFeePerGas: 2n * 10n ** 9n,
      baseFeePerGas: 15n * 10n ** 9n,
    })
  ),
  getTransactionReceipt: mock(() => Promise.resolve({ status: "success" })),
};

const mockWalletClient = {
  writeContract: mock(() => Promise.resolve("0x" + "0".repeat(64))),
};

const mockAccount = {
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
};

mock.module("viem", () => ({
  createPublicClient: mock(() => mockPublicClient),
  createWalletClient: mock(() => mockWalletClient),
  sepolia: {},
}));

mock.module("viem/accounts", () => ({
  privateKeyToAccount: mock(() => mockAccount),
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

// Mock Config
const mockConfig = {
  SEPOLIA_PRIVATE_KEY: "0x1234567890abcdef",
  SEPOLIA_RPC_URL: "https://sepolia.infura.io/v3/test",
  AUDIT_TRAIL_ADDRESS: "0x1234567890123456789012345678901234567890",
};

mock.module("@/config/config", () => ({
  Config: mockConfig,
}));

// Mock AUDIT_TRAIL_ABI
const mockAuditTrailAbi: any[] = [];
mock.module("@/contracts", () => ({
  AUDIT_TRAIL_ABI: mockAuditTrailAbi,
}));

// Mock fastTx utilities
mock.module("@/utils/fastTx", () => ({
  buildPriorityFeeOverrides: mock(() =>
    Promise.resolve({
      maxFeePerGas: 25n * 10n ** 9n,
      maxPriorityFeePerGas: 2n * 10n ** 9n,
    })
  ),
  waitForReceiptWithTimeout: mock(() => Promise.resolve({ status: "success" })),
  retryFastTransaction: mock(async (fn: () => Promise<string>) => {
    // In test mode, just return mock hash
    return "0x" + "0".repeat(64);
  }),
  FAST_TX_MAX_RETRIES: 3,
  FAST_TX_TIMEOUT_MS: 30000,
  FAST_TX_POLL_INTERVAL_MS: 1000,
}));

describe("AuditService", () => {
  let auditService: AuditService;

  beforeEach(() => {
    // Reset all mocks
    mockPublicClient.readContract.mockClear();
    mockPublicClient.waitForTransactionReceipt.mockClear();
    mockPublicClient.estimateFeesPerGas.mockClear();
    mockPublicClient.getTransactionReceipt.mockClear();
    mockWalletClient.writeContract.mockClear();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();

    // Create fresh instance for each test
    auditService = new AuditService();
  });

  afterEach(() => {
    // Reset NODE_ENV after each test
    process.env.NODE_ENV = "test";
  });

  describe("Constructor", () => {
    it("should initialize without blockchain clients in test mode", () => {
      process.env.NODE_ENV = "test";
      const service = new AuditService();

      // Should not throw and should be able to call methods
      expect(service).toBeDefined();
    });

    it("should throw error when SEPOLIA_PRIVATE_KEY is missing in non-test mode", () => {
      process.env.NODE_ENV = "development";
      const originalKey = mockConfig.SEPOLIA_PRIVATE_KEY;
      mockConfig.SEPOLIA_PRIVATE_KEY = "";

      expect(() => new AuditService()).toThrow("SEPOLIA_PRIVATE_KEY required for audit logging");

      mockConfig.SEPOLIA_PRIVATE_KEY = originalKey;
      process.env.NODE_ENV = "test";
    });
  });

  describe("logAction", () => {
    it("should successfully log an action in test mode", async () => {
      const entry = {
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        userProfile: UserProfile.COMMON,
        actionType: ActionType.USER_AUTHENTICATION,
        resource: "auth",
        action: "login_success",
        success: true,
        metadata: { sessionId: "test-session" },
        sensitiveData: { password: "secret" },
        timestamp: new Date(),
        sessionId: "test-session",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      const result = await auditService.logAction(entry);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe("Convenience Logging Methods", () => {
    it("should log authentication", async () => {
      const result = await auditService.logAuthentication(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        true,
        { sessionId: "test" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log study creation", async () => {
      const result = await auditService.logStudyCreation(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        true,
        { title: "Test Study" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log study participation", async () => {
      const result = await auditService.logStudyParticipation(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        true,
        { proof: "test-proof" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log study deletion", async () => {
      const result = await auditService.logStudyDeletion(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        true,
        { reason: "completed" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log admin action", async () => {
      const result = await auditService.logAdminAction(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "user-management",
        "ban_user",
        true,
        { targetUser: "0x123" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log data upload", async () => {
      const result = await auditService.logDataUpload(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "medical-record",
        "encrypted-cid-123",
        true,
        { fileSize: 1024 }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log data deletion", async () => {
      const result = await auditService.logDataDeletion(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "medical-record",
        "encrypted-cid-123",
        true,
        { reason: "user-request" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log data access with view type", async () => {
      const result = await auditService.logDataAccess(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "encrypted-cid-123",
        "view",
        true,
        "medical-record",
        { accessDuration: 300 }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log data access with download type", async () => {
      const result = await auditService.logDataAccess(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "encrypted-cid-123",
        "download",
        true,
        "medical-record",
        { accessDuration: 300 }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log data access without resource type", async () => {
      const result = await auditService.logDataAccess(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "encrypted-cid-123",
        "view",
        true
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log failed authentication", async () => {
      const result = await auditService.logAuthentication(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        false,
        { failureReason: "invalid_password" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log failed study creation", async () => {
      const result = await auditService.logStudyCreation(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        false,
        { error: "validation_failed" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log failed data upload", async () => {
      const result = await auditService.logDataUpload(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "medical-record",
        "encrypted-cid-123",
        false,
        { error: "storage_full" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log consent revocation", async () => {
      const result = await auditService.logConsentRevocation(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        true,
        { reason: "withdrawal" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log consent granting", async () => {
      const result = await auditService.logConsentGranting(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "study-123",
        true,
        { consentVersion: "1.0" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log username change", async () => {
      const result = await auditService.logUsernameChange(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "olduser",
        "newuser",
        true,
        { changeReason: "preference" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });
  });

  describe("Query Methods", () => {
    it("should return empty array in test mode for getUserActions", async () => {
      const result = await auditService.getUserActions(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
      );

      expect(result).toEqual([]);
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it("should return empty array in test mode for getUserLatestActions", async () => {
      const result = await auditService.getUserLatestActions(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        UserProfile.COMMON,
        50
      );

      expect(result).toEqual([]);
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it("should return null for getAuditRecord in test mode", async () => {
      const result = await auditService.getAuditRecord(42);

      expect(result).toBeNull();
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it("should return empty array in test mode for getUserActionsForProfile", async () => {
      const result = await auditService.getUserActionsForProfile(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        UserProfile.RESEARCHER,
        25
      );

      expect(result).toEqual([]);
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it("should return empty result in test mode for getUserActionsForProfilePaginated", async () => {
      const result = await auditService.getUserActionsForProfilePaginated(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        UserProfile.COMMON,
        0,
        10,
        true
      );

      expect(result).toEqual({ records: [], total: 0 });
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });
  });

  describe("Utility Methods", () => {
    it("should create data hash for empty data", () => {
      const result = (auditService as any).createDataHash({});

      expect(result).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should create data hash for sensitive data", () => {
      const sensitiveData = { password: "secret123", apiKey: "key456" };
      const result = (auditService as any).createDataHash(sensitiveData);

      expect(result).toMatch(/^0x[0-9a-f]{64}$/);
      expect(result).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should convert BigInt to number", () => {
      const result = (auditService as any).convertBigIntToNumber(BigInt(42));
      expect(result).toBe(42);
    });

    it("should convert BigInt array to number array", () => {
      const input = [BigInt(1), BigInt(2), BigInt(3)];
      const result = (auditService as any).convertBigIntToNumber(input);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should convert BigInt object to number object", () => {
      const input = { a: BigInt(10), b: BigInt(20) };
      const result = (auditService as any).convertBigIntToNumber(input);
      expect(result).toEqual({ a: 10, b: 20 });
    });

    it("should convert nested BigInt structures", () => {
      const input = {
        records: [
          { id: BigInt(1), value: BigInt(100) },
          { id: BigInt(2), value: BigInt(200) },
        ],
        total: BigInt(500),
      };
      const result = (auditService as any).convertBigIntToNumber(input);
      expect(result).toEqual({
        records: [
          { id: 1, value: 100 },
          { id: 2, value: 200 },
        ],
        total: 500,
      });
    });

    it("should handle null and undefined in convertBigIntToNumber", () => {
      expect((auditService as any).convertBigIntToNumber(null)).toBe(null);
      expect((auditService as any).convertBigIntToNumber(undefined)).toBe(undefined);
      expect((auditService as any).convertBigIntToNumber("string")).toBe("string");
    });

    it("should log action with profile detection", async () => {
      const entry = {
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actionType: ActionType.USER_AUTHENTICATION,
        resource: "auth",
        action: "login_success",
        success: true,
        suggestedProfile: UserProfile.ADMIN, // This should be overridden
      };

      const result = await auditService.logActionWithProfileDetection(entry);

      expect(result.success).toBe(true);
    });
  });

  describe("Transaction Queue", () => {
    it("should process transactions in queue order", async () => {
      const results = await Promise.all([
        auditService.logAction({
          user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          userProfile: UserProfile.COMMON,
          actionType: ActionType.USER_AUTHENTICATION,
          resource: "auth",
          action: "action1",
          success: true,
        }),
        auditService.logAction({
          user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          userProfile: UserProfile.COMMON,
          actionType: ActionType.USER_AUTHENTICATION,
          resource: "auth",
          action: "action2",
          success: true,
        }),
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing required fields in logAction", async () => {
      const invalidEntry = {
        user: "",
        userProfile: UserProfile.COMMON,
        actionType: ActionType.USER_AUTHENTICATION,
        resource: "",
        action: "",
        success: true,
      };

      // The method should still work in test mode even with invalid data
      const result = await auditService.logAction(invalidEntry as any);
      expect(result.success).toBe(true);
    });
  });

  describe("logActionForParticipants", () => {
    it("should successfully log action for participants", async () => {
      const participants = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      ];
      const entry = {
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.STUDY_STATUS_CHANGE,
        resource: "study_123",
        action: "study_completed",
        success: true,
        metadata: { studyId: "123" },
      };

      const result = await auditService.logActionForParticipants(participants, entry);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should return error when no participants provided", async () => {
      const entry = {
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.STUDY_STATUS_CHANGE,
        resource: "study_123",
        action: "study_completed",
        success: true,
      };

      const result = await auditService.logActionForParticipants([], entry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No participants provided");
    });

    it("should return error when too many participants provided", async () => {
      const participants = Array.from(
        { length: 101 },
        (_, i) => `0x${i.toString().padStart(40, "0")}`
      );
      const entry = {
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.STUDY_STATUS_CHANGE,
        resource: "study_123",
        action: "study_completed",
        success: true,
      };

      const result = await auditService.logActionForParticipants(participants, entry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Too many participants, maximum 100 allowed");
    });
  });

  describe("Study Completion and Compensation", () => {
    it("should log study completion for creator and participants", async () => {
      const creatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      const participantsAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
      ];
      const result = await auditService.logStudyCompletion(
        creatorAddress,
        participantsAddresses,
        "study-123",
        true,
        { title: "Test Study" }
      );
      expect(result.creatorLog.success).toBe(true);
      expect(result.participantsLog.success).toBe(true);
    });
    it("should log compensation sent for creator and participants", async () => {
      const creatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      const participantsAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
      ];
      const result = await auditService.logCompensationSent(
        creatorAddress,
        participantsAddresses,
        "study-123",
        true,
        1000,
        { currency: "ETH" }
      );
      expect(result.creatorLog.success).toBe(true);
      expect(result.participantsLog.success).toBe(true);
    });
    it("should log study data access for creator and participants", async () => {
      const creatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      const participantsAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
      ];
      const result = await auditService.logStudyDataAccess(
        creatorAddress,
        participantsAddresses,
        "study-123",
        true,
        { dataType: "aggregated" }
      );
      expect(result.creatorLog.success).toBe(true);
      expect(result.participantsLog.success).toBe(true);
    });
  });

  describe("Governance Logging Methods", () => {
    it("should log proposal creation", async () => {
      const result = await auditService.logProposalCreation(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "proposal-123",
        "vote",
        true,
        { description: "Test Proposal" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log vote cast with yes vote", async () => {
      const result = await auditService.logVoteCast(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "proposal-123",
        "yes",
        true,
        { votingPower: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log vote cast with no vote", async () => {
      const result = await auditService.logVoteCast(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "proposal-123",
        "no",
        true
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log vote cast with abstain vote", async () => {
      const result = await auditService.logVoteCast(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "proposal-123",
        "abstain",
        true
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });

    it("should log proposal removal", async () => {
      const result = await auditService.logProposalRemoval(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "proposal-123",
        "spam",
        true,
        { removedBy: "admin" }
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe("0x" + "0".repeat(64));
    });
  });

  describe("Static Methods", () => {
    it("should return COMMON profile for USER_AUTHENTICATION", () => {
      const profile = AuditService.getProfileForActionType(
        ActionType.USER_AUTHENTICATION,
        UserProfile.ADMIN
      );
      expect(profile).toBe(UserProfile.COMMON);
    });

    it("should return COMMON profile for PROPOSAL_CREATION", () => {
      const profile = AuditService.getProfileForActionType(
        ActionType.PROPOSAL_CREATION,
        UserProfile.RESEARCHER
      );
      expect(profile).toBe(UserProfile.COMMON);
    });

    it("should return COMMON profile for VOTE_CAST", () => {
      const profile = AuditService.getProfileForActionType(
        ActionType.VOTE_CAST,
        UserProfile.DATA_SELLER
      );
      expect(profile).toBe(UserProfile.COMMON);
    });

    it("should return COMMON profile for PROPOSAL_REMOVAL", () => {
      const profile = AuditService.getProfileForActionType(
        ActionType.PROPOSAL_REMOVAL,
        UserProfile.ADMIN
      );
      expect(profile).toBe(UserProfile.COMMON);
    });

    it("should return default profile for other action types", () => {
      const profile = AuditService.getProfileForActionType(
        ActionType.STUDY_CREATION,
        UserProfile.RESEARCHER
      );
      expect(profile).toBe(UserProfile.RESEARCHER);
    });
  });

  describe("logActionWithProfileDetection variations", () => {
    it("should use COMMON profile for PROPOSAL_CREATION action", async () => {
      const result = await auditService.logActionWithProfileDetection({
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actionType: ActionType.PROPOSAL_CREATION,
        resource: "proposal",
        action: "create_proposal",
        success: true,
        suggestedProfile: UserProfile.ADMIN,
      });

      expect(result.success).toBe(true);
    });

    it("should use COMMON profile for VOTE_CAST action", async () => {
      const result = await auditService.logActionWithProfileDetection({
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actionType: ActionType.VOTE_CAST,
        resource: "proposal",
        action: "vote",
        success: true,
        suggestedProfile: UserProfile.RESEARCHER,
      });

      expect(result.success).toBe(true);
    });

    it("should use COMMON profile for PROPOSAL_REMOVAL action", async () => {
      const result = await auditService.logActionWithProfileDetection({
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actionType: ActionType.PROPOSAL_REMOVAL,
        resource: "proposal",
        action: "remove",
        success: true,
        suggestedProfile: UserProfile.DATA_SELLER,
      });

      expect(result.success).toBe(true);
    });

    it("should use suggested profile for non-COMMON action types", async () => {
      const result = await auditService.logActionWithProfileDetection({
        user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actionType: ActionType.STUDY_CREATION,
        resource: "study",
        action: "create",
        success: true,
        suggestedProfile: UserProfile.RESEARCHER,
      });

      expect(result.success).toBe(true);
    });
  });
});

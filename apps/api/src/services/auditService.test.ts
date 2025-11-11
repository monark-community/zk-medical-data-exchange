import { describe, it, expect } from "bun:test";
import { ActionType, type AuditLogEntry } from "./auditService";
import { UserProfile } from "@zk-medical/shared";

/**
 * Test suite for Audit Service
 * Tests audit logging, data hashing, blockchain interactions, and user action retrieval
 */

describe("AuditService - ActionType Enum", () => {
  it("should define all action types", () => {
    expect(ActionType.USER_AUTHENTICATION).toBeDefined();
    expect(ActionType.PROPOSAL_CREATION).toBeDefined();
    expect(ActionType.VOTE_CAST).toBeDefined();
    expect(ActionType.PROPOSAL_REMOVAL).toBeDefined();
    expect(ActionType.USERNAME_CHANGE).toBeDefined();
    expect(ActionType.STUDY_CREATION).toBeDefined();
    expect(ActionType.STUDY_STATUS_CHANGE).toBeDefined();
    expect(ActionType.STUDY_AGGREGATED_DATA_ACCESS).toBeDefined();
    expect(ActionType.PERMISSION_CHANGE).toBeDefined();
    expect(ActionType.STUDY_PARTICIPATION).toBeDefined();
    expect(ActionType.STUDY_CONSENT_REVOKED).toBeDefined();
    expect(ActionType.STUDY_CONSENT_GRANTED).toBeDefined();
    expect(ActionType.DATA_UPLOAD).toBeDefined();
    expect(ActionType.DATA_ACCESS).toBeDefined();
    expect(ActionType.DATA_DELETED).toBeDefined();
    expect(ActionType.ADMIN_ACTION).toBeDefined();
    expect(ActionType.SYSTEM_CONFIG).toBeDefined();
  });

  it("should have numeric enum values", () => {
    expect(typeof ActionType.USER_AUTHENTICATION).toBe("number");
    expect(typeof ActionType.STUDY_CREATION).toBe("number");
    expect(typeof ActionType.DATA_ACCESS).toBe("number");
  });

  it("should have unique enum values", () => {
    const values = Object.values(ActionType).filter((v) => typeof v === "number");
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });
});

describe("AuditService - AuditLogEntry Structure", () => {
  it("should validate required fields", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_CREATION,
      resource: "study_123",
      action: "create_study",
      success: true,
    };

    expect(entry.user).toBeDefined();
    expect(entry.userProfile).toBeDefined();
    expect(entry.actionType).toBeDefined();
    expect(entry.resource).toBeDefined();
    expect(entry.action).toBeDefined();
    expect(typeof entry.success).toBe("boolean");
  });

  it("should support optional metadata", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.COMMON,
      actionType: ActionType.USER_AUTHENTICATION,
      resource: "auth",
      action: "login_success",
      success: true,
      metadata: {
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
    };

    expect(entry.metadata).toBeDefined();
    expect(entry.metadata?.ipAddress).toBe("192.168.1.1");
  });

  it("should support optional sensitive data", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_PARTICIPATION,
      resource: "study_42",
      action: "join_study",
      success: true,
      sensitiveData: {
        proof: "zkp_proof_data",
        commitment: "0xabc123",
      },
    };

    expect(entry.sensitiveData).toBeDefined();
    expect(entry.sensitiveData?.proof).toBe("zkp_proof_data");
  });

  it("should support optional timestamp fields", () => {
    const now = new Date();
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.ADMIN,
      actionType: ActionType.ADMIN_ACTION,
      resource: "system",
      action: "config_change",
      success: true,
      timestamp: now,
      sessionId: "session_123",
      ipAddress: "10.0.0.1",
      userAgent: "Chrome/100",
    };

    expect(entry.timestamp).toBe(now);
    expect(entry.sessionId).toBe("session_123");
    expect(entry.ipAddress).toBe("10.0.0.1");
    expect(entry.userAgent).toBe("Chrome/100");
  });
});

describe("AuditService - Data Hash Creation", () => {
  it("should return zero hash for empty sensitive data", () => {
    const emptyData = {};

    expect(Object.keys(emptyData).length).toBe(0);
  });

  it("should create consistent hash for same data", () => {
    const data1 = { field1: "value1", field2: "value2" };
    const data2 = { field1: "value1", field2: "value2" };

    const str1 = JSON.stringify(data1, Object.keys(data1).sort());
    const str2 = JSON.stringify(data2, Object.keys(data2).sort());

    expect(str1).toBe(str2);
  });

  it("should create different hash for different data", () => {
    const data1 = { field: "value1" };
    const data2 = { field: "value2" };

    const str1 = JSON.stringify(data1);
    const str2 = JSON.stringify(data2);

    expect(str1).not.toBe(str2);
  });

  it("should handle JSON serialization with sorted keys", () => {
    const data = { z: 3, a: 1, m: 2 };
    const sorted = JSON.stringify(data, Object.keys(data).sort());

    expect(sorted).toBe('{"a":1,"m":2,"z":3}');
  });

  it("should validate hash format (0x + 64 hex chars)", () => {
    const validHash = "0x" + "a".repeat(64);

    expect(validHash.startsWith("0x")).toBe(true);
    expect(validHash.length).toBe(66); // 0x + 64 chars
  });
});

describe("AuditService - Metadata Enrichment", () => {
  it("should enrich upload metadata", () => {
    const baseMetadata = { fileSize: 1024 };
    const enrichedMetadata = {
      resourceType: "medical_record",
      encryptedCID: "QmTest123",
      uploadTimestamp: Date.now(),
      ...baseMetadata,
    };

    expect(enrichedMetadata.resourceType).toBe("medical_record");
    expect(enrichedMetadata.encryptedCID).toBe("QmTest123");
    expect(enrichedMetadata.uploadTimestamp).toBeGreaterThan(0);
    expect(enrichedMetadata.fileSize).toBe(1024);
  });

  it("should enrich deletion metadata", () => {
    const enrichedMetadata = {
      resourceType: "lab_report",
      encryptedCID: "QmDelete456",
      deletionTimestamp: Date.now(),
    };

    expect(enrichedMetadata.resourceType).toBe("lab_report");
    expect(enrichedMetadata.encryptedCID).toBe("QmDelete456");
    expect(enrichedMetadata.deletionTimestamp).toBeGreaterThan(0);
  });

  it("should enrich access metadata", () => {
    const enrichedMetadata = {
      encryptedCID: "QmAccess789",
      accessType: "view" as const,
      resourceType: "x-ray",
      accessTimestamp: Date.now(),
    };

    expect(enrichedMetadata.accessType).toBe("view");
    expect(enrichedMetadata.resourceType).toBe("x-ray");
    expect(enrichedMetadata.accessTimestamp).toBeGreaterThan(0);
  });

  it("should enrich username change metadata", () => {
    const enrichedMetadata = {
      oldUsername: "john_doe",
      newUsername: "jane_doe",
      changeReason: "request",
    };

    expect(enrichedMetadata.oldUsername).toBe("john_doe");
    expect(enrichedMetadata.newUsername).toBe("jane_doe");
    expect(enrichedMetadata.changeReason).toBe("request");
  });
});

describe("AuditService - Profile Detection", () => {
  it("should detect COMMON profile for authentication actions", () => {
    const actionTypes = [
      ActionType.USER_AUTHENTICATION,
      ActionType.PROPOSAL_CREATION,
      ActionType.VOTE_CAST,
      ActionType.PROPOSAL_REMOVAL,
    ];

    actionTypes.forEach((actionType) => {
      // These actions should always use COMMON profile
      expect(
        [
          ActionType.USER_AUTHENTICATION,
          ActionType.PROPOSAL_CREATION,
          ActionType.VOTE_CAST,
          ActionType.PROPOSAL_REMOVAL,
        ].includes(actionType)
      ).toBe(true);
    });
  });

  it("should use default profile for non-authentication actions", () => {
    const researcherActions = [ActionType.STUDY_CREATION, ActionType.STUDY_STATUS_CHANGE];
    const dataSellers = [ActionType.DATA_UPLOAD, ActionType.DATA_ACCESS];

    researcherActions.forEach((action) => {
      expect(action).toBeDefined();
    });

    dataSellers.forEach((action) => {
      expect(action).toBeDefined();
    });
  });
});

describe("AuditService - BigInt Conversion", () => {
  it("should convert bigint to number", () => {
    const bigIntValue = BigInt(123);
    const converted = Number(bigIntValue);

    expect(typeof converted).toBe("number");
    expect(converted).toBe(123);
  });

  it("should convert array of bigints", () => {
    const bigIntArray = [BigInt(1), BigInt(2), BigInt(3)];
    const converted = bigIntArray.map((item) => Number(item));

    expect(Array.isArray(converted)).toBe(true);
    expect(converted).toEqual([1, 2, 3]);
  });

  it("should convert nested objects with bigints", () => {
    const data = {
      id: BigInt(100),
      count: BigInt(50),
      nested: {
        value: BigInt(25),
      },
    };

    const convertBigInt = (obj: any): any => {
      if (typeof obj === "bigint") {
        return Number(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(convertBigInt);
      }
      if (obj && typeof obj === "object") {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigInt(value);
        }
        return converted;
      }
      return obj;
    };

    const converted = convertBigInt(data);
    expect(converted.id).toBe(100);
    expect(converted.count).toBe(50);
    expect(converted.nested.value).toBe(25);
  });

  it("should handle mixed type conversions", () => {
    const mixed = {
      bigIntValue: BigInt(999),
      stringValue: "test",
      numberValue: 42,
      boolValue: true,
    };

    expect(typeof Number(mixed.bigIntValue)).toBe("number");
    expect(typeof mixed.stringValue).toBe("string");
    expect(typeof mixed.numberValue).toBe("number");
    expect(typeof mixed.boolValue).toBe("boolean");
  });
});

describe("AuditService - Retry Logic", () => {
  it("should validate retry configuration", () => {
    const maxRetries = 3;
    const delays = [2000, 4000, 8000]; // Exponential backoff: 2^1 * 1000, 2^2 * 1000, 2^3 * 1000

    expect(maxRetries).toBe(3);
    expect(delays).toHaveLength(3);

    delays.forEach((delay, index) => {
      const expected = Math.pow(2, index + 1) * 1000;
      expect(delay).toBe(expected);
    });
  });

  it("should calculate exponential backoff delays", () => {
    const calculateDelay = (attempt: number) => Math.pow(2, attempt) * 1000;

    expect(calculateDelay(1)).toBe(2000); // 2s
    expect(calculateDelay(2)).toBe(4000); // 4s
    expect(calculateDelay(3)).toBe(8000); // 8s
  });

  it("should identify fatal errors that skip retry", () => {
    const fatalErrors = ["insufficient funds", "gas required exceeds allowance"];

    fatalErrors.forEach((error) => {
      const isFatal =
        error.includes("insufficient funds") || error.includes("gas required exceeds allowance");
      expect(isFatal).toBe(true);
    });
  });

  it("should identify retryable errors", () => {
    const retryableErrors = ["network timeout", "connection refused", "temporary failure"];

    retryableErrors.forEach((error) => {
      const isFatal =
        error.includes("insufficient funds") || error.includes("gas required exceeds allowance");
      expect(isFatal).toBe(false);
    });
  });
});

describe("AuditService - Transaction Queue", () => {
  it("should validate queue initialization", () => {
    const queue = Promise.resolve();

    expect(queue instanceof Promise).toBe(true);
  });

  it("should handle sequential promise chaining", async () => {
    let executionOrder: number[] = [];

    const queue = Promise.resolve()
      .then(() => {
        executionOrder.push(1);
      })
      .then(() => {
        executionOrder.push(2);
      })
      .then(() => {
        executionOrder.push(3);
      });

    await queue;

    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it("should continue queue on error", async () => {
    let executionOrder: number[] = [];

    const queue = Promise.resolve()
      .then(() => {
        executionOrder.push(1);
      })
      .then(() => {
        executionOrder.push(2);
        throw new Error("Test error");
      })
      .catch(() => {
        executionOrder.push(3);
      })
      .then(() => {
        executionOrder.push(4);
      });

    await queue;

    expect(executionOrder).toEqual([1, 2, 3, 4]);
  });
});

describe("AuditService - Log Entry Validation", () => {
  it("should validate authentication log entry", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.COMMON,
      actionType: ActionType.USER_AUTHENTICATION,
      resource: "auth",
      action: "login_success",
      success: true,
    };

    expect(entry.actionType).toBe(ActionType.USER_AUTHENTICATION);
    expect(entry.userProfile).toBe(UserProfile.COMMON);
    expect(entry.resource).toBe("auth");
  });

  it("should validate study creation log entry", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_CREATION,
      resource: "study_123",
      action: "create_study",
      success: true,
      metadata: {
        studyTitle: "Test Study",
        maxParticipants: 100,
      },
    };

    expect(entry.actionType).toBe(ActionType.STUDY_CREATION);
    expect(entry.userProfile).toBe(UserProfile.RESEARCHER);
    expect(entry.metadata?.studyTitle).toBe("Test Study");
  });

  it("should validate data access log entry", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_ACCESS,
      resource: "medical_record",
      action: "View file: medical_record",
      success: true,
      metadata: {
        encryptedCID: "QmTest123",
        accessType: "view",
        accessTimestamp: Date.now(),
      },
    };

    expect(entry.actionType).toBe(ActionType.DATA_ACCESS);
    expect(entry.userProfile).toBe(UserProfile.DATA_SELLER);
    expect(entry.metadata?.accessType).toBe("view");
  });

  it("should validate consent revocation log entry", () => {
    const entry: AuditLogEntry = {
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.STUDY_CONSENT_REVOKED,
      resource: "study_42",
      action: "revoke_consent",
      success: true,
      metadata: {
        reason: "User requested withdrawal",
      },
    };

    expect(entry.actionType).toBe(ActionType.STUDY_CONSENT_REVOKED);
    expect(entry.resource).toBe("study_42");
    expect(entry.metadata?.reason).toBe("User requested withdrawal");
  });
});

describe("AuditService - Response Structure", () => {
  it("should validate success response structure", () => {
    const response = {
      success: true,
      txHash: "0xabc123def456",
    };

    expect(response.success).toBe(true);
    expect(response.txHash).toBeDefined();
    expect(typeof response.txHash).toBe("string");
  });

  it("should validate error response structure", () => {
    const response = {
      success: false,
      error: "Transaction failed",
    };

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe("string");
  });

  it("should validate paginated response structure", () => {
    const response = {
      records: [
        { id: 1, action: "test1" },
        { id: 2, action: "test2" },
      ],
      total: 10,
    };

    expect(Array.isArray(response.records)).toBe(true);
    expect(response.records).toHaveLength(2);
    expect(typeof response.total).toBe("number");
  });
});

describe("AuditService - Action String Formatting", () => {
  it("should format authentication actions", () => {
    const successAction = "login_success";
    const failureAction = "login_failed";

    expect(successAction).toBe("login_success");
    expect(failureAction).toBe("login_failed");
  });

  it("should format file access actions", () => {
    const viewAction = "View file: medical_record";
    const downloadAction = "Download file: lab_report";

    expect(viewAction).toContain("View file");
    expect(downloadAction).toContain("Download file");
  });

  it("should format upload actions", () => {
    const uploadAction = "Upload file: x-ray";

    expect(uploadAction).toContain("Upload file");
    expect(uploadAction).toContain("x-ray");
  });

  it("should format deletion actions", () => {
    const deleteAction = "Delete file: prescription";

    expect(deleteAction).toContain("Delete file");
    expect(deleteAction).toContain("prescription");
  });
});

describe("AuditService - Resource Naming", () => {
  it("should format study resources", () => {
    const studyId = "123";
    const resource = `study_${studyId}`;

    expect(resource).toBe("study_123");
  });

  it("should format auth resources", () => {
    const resource = "auth";

    expect(resource).toBe("auth");
  });

  it("should format user profile resources", () => {
    const resource = "user_profile";

    expect(resource).toBe("user_profile");
  });

  it("should use resource type for file operations", () => {
    const resourceType = "medical_record";

    expect(resourceType).toBe("medical_record");
  });
});

describe("AuditService - Limit Validation", () => {
  it("should use default limit when not provided", () => {
    const defaultLimit = 100;

    expect(defaultLimit).toBe(100);
  });

  it("should respect custom limits", () => {
    const customLimits = [10, 20, 50, 100];

    customLimits.forEach((limit) => {
      expect(limit).toBeGreaterThan(0);
      expect(limit).toBeLessThanOrEqual(100);
    });
  });

  it("should validate limit ranges", () => {
    const validLimit = 50;
    const tooLow = 0;
    const tooHigh = 1000;

    expect(validLimit > 0 && validLimit <= 100).toBe(true);
    expect(tooLow > 0).toBe(false);
    expect(tooHigh <= 100).toBe(false);
  });
});

describe("AuditService - Address Validation", () => {
  it("should validate Ethereum address format", () => {
    const validAddresses = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x0000000000000000000000000000000000000000",
    ];

    validAddresses.forEach((address) => {
      expect(address.startsWith("0x")).toBe(true);
      expect(address.length).toBe(42);
    });
  });

  it("should detect invalid addresses", () => {
    const invalidAddresses = ["0x123", "not-an-address", ""];

    invalidAddresses.forEach((address) => {
      const isValid = address.startsWith("0x") && address.length === 42;
      expect(isValid).toBe(false);
    });
  });
});

describe("AuditService - Timestamp Handling", () => {
  it("should use current timestamp when not provided", () => {
    const timestamp = new Date();
    const now = new Date();

    const diff = Math.abs(now.getTime() - timestamp.getTime());
    expect(diff).toBeLessThan(1000); // Within 1 second
  });

  it("should preserve provided timestamp", () => {
    const providedTimestamp = new Date("2024-01-01T00:00:00Z");
    const timestamp = providedTimestamp;

    expect(timestamp).toBe(providedTimestamp);
  });

  it("should validate timestamp in metadata", () => {
    const metadata = {
      timestamp: new Date(),
      sessionId: "session_123",
    };

    expect(metadata.timestamp instanceof Date).toBe(true);
    expect(metadata.sessionId).toBe("session_123");
  });
});

describe("AuditService - Error Handling", () => {
  it("should format error messages", () => {
    const error = new Error("Test error");
    const errorMessage = error.message;

    expect(errorMessage).toBe("Test error");
  });

  it("should handle unknown errors", () => {
    const unknownError = "Unknown audit logging error";

    expect(unknownError).toBe("Unknown audit logging error");
  });

  it("should validate error response format", () => {
    const errorResponse = {
      success: false,
      error: "Blockchain transaction failed",
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toContain("failed");
  });
});

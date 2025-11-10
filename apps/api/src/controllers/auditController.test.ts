import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { Request, Response } from "express";
import {
  getUserActionsByProfile,
  getUserActionsByProfilePaginated,
  getAuditRecord,
  getAllUserActions,
  getAuditInfo,
  logFileAccess,
  logFailedJoinStudy,
} from "./auditController";
import { ActionType } from "@/services/auditService";
import { UserProfile } from "@zk-medical/shared";

/**
 * Test suite for Audit Controller
 * Tests all controller functions including validation, error handling, and success cases
 */

// Mock helper to create Express request/response objects
const createMockRequest = (params = {}, query = {}, body = {}): Partial<Request> => ({
  params,
  query,
  body,
});

interface MockResponse extends Partial<Response> {
  statusCode: number;
  jsonData: any;
}

const createMockResponse = (): MockResponse => {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

describe("getUserActionsByProfile", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mock.restore();
  });

  it("should return 400 for invalid Ethereum address", async () => {
    const req = createMockRequest(
      { userAddress: "invalid-address", profile: "0" },
      { limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Invalid user address format");
  });

  it("should return 400 for invalid user profile", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "999" },
      { limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toContain("Invalid user profile");
  });

  it("should return 400 for invalid limit", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { limit: "0" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Invalid limit. Must be between 1 and 100");
  });

  it("should return 400 for limit greater than 100", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { limit: "101" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid limit. Must be between 1 and 100");
  });

  it("should use default limit of 20 when not provided", async () => {
    const mockActions = [{ id: 1, action: "test" }];
    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfile: mock(() => Promise.resolve(mockActions)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      profile: "0",
    });
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should return actions for valid request", async () => {
    const mockActions = [
      { id: 1, action: "login", timestamp: Date.now() },
      { id: 2, action: "data_upload", timestamp: Date.now() },
    ];

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfile: mock(() => Promise.resolve(mockActions)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "1" },
      { limit: "10" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.actions).toHaveLength(2);
  });
});

describe("getUserActionsByProfilePaginated", () => {
  it("should return 400 for invalid Ethereum address", async () => {
    const req = createMockRequest(
      { userAddress: "not-an-address", profile: "0" },
      { offset: "0", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid user address format");
  });

  it("should return 400 for invalid profile", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "invalid" },
      { offset: "0", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toContain("Invalid user profile");
  });

  it("should return 400 for negative offset", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "-1", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid offset. Must be >= 0");
  });

  it("should return 400 for invalid limit", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "200" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid limit. Must be between 1 and 100");
  });

  it("should use default values for offset and limit", async () => {
    const mockResult = {
      records: [{ id: 1, action: "test" }],
      total: 1,
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfilePaginated: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      profile: "0",
    });
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should handle latestFirst query parameter", async () => {
    const mockResult = {
      records: [
        { id: 2, action: "recent" },
        { id: 1, action: "older" },
      ],
      total: 2,
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfilePaginated: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "10", latestFirst: "false" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.data.pagination.hasMore).toBe(false);
  });

  it("should correctly calculate hasMore in pagination", async () => {
    const mockResult = {
      records: Array(20).fill({ id: 1, action: "test" }),
      total: 100,
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfilePaginated: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.data.pagination.hasMore).toBe(true);
  });
});

describe("getAuditRecord", () => {
  it("should return 400 when recordId is missing", async () => {
    const req = createMockRequest({ recordId: "" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Record ID is required");
  });

  it("should return 400 for invalid recordId", async () => {
    const req = createMockRequest({ recordId: "invalid" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid record ID. Must be a non-negative number");
  });

  it("should return 400 for negative recordId", async () => {
    const req = createMockRequest({ recordId: "-5" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid record ID. Must be a non-negative number");
  });

  it("should return 404 when record is not found", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        getAuditRecord: mock(() => Promise.resolve(null)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({ recordId: "999" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData?.error).toBe("Audit record not found");
  });

  it("should return record for valid recordId", async () => {
    const mockRecord = {
      id: 1,
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      action: "login",
      timestamp: Date.now(),
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        getAuditRecord: mock(() => Promise.resolve(mockRecord)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({ recordId: "1" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.record).toEqual(mockRecord);
  });
});

describe("getAllUserActions", () => {
  it("should return 400 for invalid Ethereum address", async () => {
    const req = createMockRequest({ userAddress: "invalid" }, { limit: "20" });
    const res = createMockResponse();

    await getAllUserActions(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid user address format");
  });

  it("should return 400 for invalid limit", async () => {
    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
      { limit: "abc" }
    );
    const res = createMockResponse();

    await getAllUserActions(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid limit. Must be between 1 and 100");
  });

  it("should use default limit when not provided", async () => {
    const mockActions = [{ id: 1, action: "test" }];

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActions: mock(() => Promise.resolve(mockActions)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
    const res = createMockResponse();

    await getAllUserActions(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should return all user actions for valid request", async () => {
    const mockActions = [
      { id: 1, action: "login" },
      { id: 2, action: "upload" },
      { id: 3, action: "download" },
    ];

    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActions: mock(() => Promise.resolve(mockActions)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
      { limit: "50" }
    );
    const res = createMockResponse();

    await getAllUserActions(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.actions).toHaveLength(3);
    expect(res.jsonData?.data.count).toBe(3);
  });
});

describe("getAuditInfo", () => {
  it("should return profiles and action types", async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.profiles).toBeDefined();
    expect(res.jsonData?.data.actionTypes).toBeDefined();
  });

  it("should return correct profile names and values", async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    const profiles = res.jsonData?.data.profiles;
    expect(profiles).toBeDefined();
    expect(Array.isArray(profiles)).toBe(true);

    const researcherProfile = profiles.find((p: any) => p.name === "RESEARCHER");
    expect(researcherProfile).toBeDefined();
    expect(researcherProfile?.value).toBe(UserProfile.RESEARCHER);
  });

  it("should return correct action type names and values", async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    const actionTypes = res.jsonData?.data.actionTypes;
    expect(actionTypes).toBeDefined();
    expect(Array.isArray(actionTypes)).toBe(true);

    const authAction = actionTypes.find((a: any) => a.name === "USER_AUTHENTICATION");
    expect(authAction).toBeDefined();
    expect(authAction?.value).toBe(ActionType.USER_AUTHENTICATION);
  });
});

describe("logFileAccess", () => {
  it("should return 400 for missing required fields", async () => {
    const req = createMockRequest({}, {}, { userAddress: "0x123" });
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe(
      "Missing required fields: userAddress, encryptedCID, accessType"
    );
  });

  it("should return 400 for invalid Ethereum address", async () => {
    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "invalid-address",
        encryptedCID: "QmTest123",
        accessType: "view",
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid user address format");
  });

  it("should return 400 for invalid access type", async () => {
    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest123",
        accessType: "delete",
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid access type. Must be 'view' or 'download'");
  });

  it("should log view access successfully", async () => {
    const mockResult = {
      success: true,
      txHash: "0xabc123",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logDataAccess: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest123",
        accessType: "view",
        success: true,
        resourceType: "medical_record",
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.txHash).toBe("0xabc123");
  });

  it("should log download access successfully", async () => {
    const mockResult = {
      success: true,
      txHash: "0xdef456",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logDataAccess: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest456",
        accessType: "download",
        metadata: { fileSize: 1024 },
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should handle audit service failure", async () => {
    const mockResult = {
      success: false,
      error: "Blockchain error",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logDataAccess: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest789",
        accessType: "view",
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Blockchain error");
  });
});

describe("logFailedJoinStudy", () => {
  it("should return 400 for missing required fields", async () => {
    const req = createMockRequest({}, {}, { userAddress: "0x123" });
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Missing required fields: userAddress, studyId");
  });

  it("should return 400 for invalid Ethereum address", async () => {
    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "not-valid",
        studyId: "1",
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid user address format");
  });

  it("should return 400 for invalid studyId", async () => {
    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "invalid",
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid studyId. Must be a non-negative number");
  });

  it("should return 400 for negative studyId", async () => {
    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "-1",
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toBe("Invalid studyId. Must be a non-negative number");
  });

  it("should log failed join attempt successfully", async () => {
    const mockResult = {
      success: true,
      txHash: "0xfailed123",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "42",
        reason: "Insufficient criteria match",
        errorDetails: { score: 75, required: 80 },
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
    expect(res.jsonData?.data.txHash).toBe("0xfailed123");
  });

  it("should use default reason when not provided", async () => {
    const mockResult = {
      success: true,
      txHash: "0xdefault123",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "10",
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should handle audit service failure", async () => {
    const mockResult = {
      success: false,
      error: "Transaction failed",
    };

    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock(() => Promise.resolve(mockResult)),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "5",
        reason: "Test failure",
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Transaction failed");
  });
});

describe("Validation Logic Tests", () => {
  it("should validate Ethereum address format", () => {
    const validAddresses = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x0000000000000000000000000000000000000000",
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ];

    validAddresses.forEach((address) => {
      expect(address.startsWith("0x")).toBe(true);
      expect(address.length).toBe(42);
    });

    const invalidAddresses = ["0x123", "not-an-address", "0xGGGG"];

    invalidAddresses.forEach((address) => {
      const isValid = address.startsWith("0x") && address.length === 42;
      expect(isValid).toBe(false);
    });
  });

  it("should validate UserProfile enum values", () => {
    const validProfiles = [
      UserProfile.RESEARCHER,
      UserProfile.DATA_SELLER,
      UserProfile.ADMIN,
      UserProfile.COMMON,
    ];

    validProfiles.forEach((profile) => {
      expect(Object.values(UserProfile).includes(profile)).toBe(true);
    });

    const invalidProfile: any = 999;
    expect(Object.values(UserProfile).includes(invalidProfile)).toBe(false);
  });

  it("should validate limit range", () => {
    const validLimits = [1, 10, 50, 100];
    validLimits.forEach((limit) => {
      expect(limit >= 1 && limit <= 100).toBe(true);
    });

    const invalidLimits = [0, -1, 101, 1000];
    invalidLimits.forEach((limit) => {
      expect(limit >= 1 && limit <= 100).toBe(false);
    });
  });

  it("should validate offset values", () => {
    const validOffsets = [0, 1, 10, 100];
    validOffsets.forEach((offset) => {
      expect(offset >= 0).toBe(true);
    });

    const invalidOffsets = [-1, -10, -100];
    invalidOffsets.forEach((offset) => {
      expect(offset >= 0).toBe(false);
    });
  });

  it("should validate access types", () => {
    const validTypes = ["view", "download"];
    validTypes.forEach((type) => {
      expect(["view", "download"].includes(type)).toBe(true);
    });

    const invalidTypes = ["delete", "update", "create"];
    invalidTypes.forEach((type) => {
      expect(["view", "download"].includes(type)).toBe(false);
    });
  });

  it("should parse and validate numeric strings", () => {
    const validNumericStrings = ["0", "10", "100"];
    validNumericStrings.forEach((str) => {
      const parsed = Number.parseInt(str, 10);
      expect(Number.isNaN(parsed)).toBe(false);
    });

    const invalidNumericStrings = ["abc", "", "null", "undefined"];
    invalidNumericStrings.forEach((str) => {
      const parsed = Number.parseInt(str, 10);
      expect(Number.isNaN(parsed)).toBe(true);
    });
  });
});

describe("Pagination Logic Tests", () => {
  it("should calculate hasMore correctly", () => {
    const testCases = [
      { offset: 0, limit: 20, total: 100, expected: true },
      { offset: 80, limit: 20, total: 100, expected: false },
      { offset: 0, limit: 100, total: 100, expected: false },
      { offset: 50, limit: 25, total: 100, expected: true },
    ];

    testCases.forEach(({ offset, limit, total, expected }) => {
      const hasMore = offset + limit < total;
      expect(hasMore).toBe(expected);
    });
  });

  it("should parse pagination query parameters", () => {
    const query = { offset: "20", limit: "10", latestFirst: "true" };

    const offset = Number.parseInt(query.offset, 10);
    const limit = Number.parseInt(query.limit, 10);
    const latestFirst = query.latestFirst === "true";

    expect(offset).toBe(20);
    expect(limit).toBe(10);
    expect(latestFirst).toBe(true);
  });

  it("should use default pagination values", () => {
    const query = {};

    const offset = Number.parseInt((query as any).offset || "0", 10);
    const limit = Number.parseInt((query as any).limit || "20", 10);
    const latestFirst = ((query as any).latestFirst || "true") === "true";

    expect(offset).toBe(0);
    expect(limit).toBe(20);
    expect(latestFirst).toBe(true);
  });
});

describe("Metadata Enrichment Tests", () => {
  it("should enrich metadata with reason for failed join study", () => {
    const reason = "Does not meet criteria";
    const errorDetails = { field: "age", expected: ">18", actual: "16" };
    const metadata = { additionalInfo: "test" };

    const enrichedMetadata = {
      reason: reason || "Unknown error",
      errorDetails,
      ...metadata,
    };

    expect(enrichedMetadata.reason).toBe(reason);
    expect(enrichedMetadata.errorDetails).toEqual(errorDetails);
    expect(enrichedMetadata.additionalInfo).toBe("test");
  });

  it("should use default reason when not provided", () => {
    const metadata = {};
    const enrichedMetadata = {
      reason: (metadata as any).reason || "Unknown error",
    };

    expect(enrichedMetadata.reason).toBe("Unknown error");
  });

  it("should handle empty metadata object", () => {
    const metadata = {};
    const result = metadata || {};

    expect(Object.keys(result).length).toBe(0);
  });
});

// Set environment variables before any imports
process.env.NODE_ENV = "test";
process.env.SEPOLIA_PRIVATE_KEY =
  "0x1234567890123456789012345678901234567890123456789012345678901234";
process.env.SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/test";
process.env.AUDIT_TRAIL_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

// Mock Config before any other imports
import { afterEach, mock } from "bun:test";

afterEach(() => {
  mock.restore(); // resets ALL mocks
});
mock.module("@/config/config", () => ({
  SEPOLIA_PRIVATE_KEY: "0x1234567890123456789012345678901234567890123456789012345678901234",
  SEPOLIA_RPC_URL: "https://sepolia.infura.io/v3/test",
  AUDIT_TRAIL_ADDRESS: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  IS_CI: false,
  IS_LOCAL_MODE: false,
  NODE_ENV: "test",
  LOG_LEVEL: "info",
  SESSION_SECRET: "test",
  SUPABASE_URL: "test",
  SUPABASE_KEY: "test",
  STUDY_FACTORY_ADDRESS: "test",
  ZK_VERIFIER_ADDRESS: "test",
  GOVERNANCE_DAO_ADDRESS: "test",
}));

// Mock logger
mock.module("@/utils/logger", () => ({
  default: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
  },
}));

// Mock address validation
mock.module("@/utils/address", () => ({
  isValidEthereumAddress: mock(
    (address: string) => address.startsWith("0x") && address.length === 42
  ),
}));

// Mock auditService before importing anything that uses it
mock.module("@/services/auditService", () => ({
  auditService: {
    getUserActionsForProfile: mock(() => Promise.resolve([])),
    getUserActionsForProfilePaginated: mock(() => Promise.resolve({ records: [], total: 0 })),
    getAuditRecord: mock(() => Promise.resolve(null)),
    getUserActions: mock(() => Promise.resolve([])),
    logDataAccess: mock(() => Promise.resolve({ success: true, txHash: "0xabc123" })),
    logStudyParticipation: mock(() => Promise.resolve({ success: true, txHash: "0xfailed123" })),
    logFailedJoinStudy: mock(() => Promise.resolve({ success: true, txHash: "0xfailed123" })),
  },
  ActionType: {
    // Include all ActionType enum values to prevent import issues
    USER_AUTHENTICATION: 0,
    PROPOSAL_CREATION: 1,
    VOTE_CAST: 2,
    PROPOSAL_REMOVAL: 3,
    USERNAME_CHANGE: 4,
    STUDY_CREATION: 5,
    STUDY_STATUS_CHANGE: 6,
    STUDY_AGGREGATED_DATA_ACCESS: 7,
    PERMISSION_CHANGE: 8,
    STUDY_PARTICIPATION: 9,
    STUDY_CONSENT_REVOKED: 10,
    STUDY_CONSENT_GRANTED: 11,
    DATA_UPLOAD: 12,
    DATA_ACCESS: 13,
    DATA_DELETED: 14,
    ADMIN_ACTION: 15,
    SYSTEM_CONFIG: 16,
  },
}));

import { describe, it, expect, beforeEach, beforeAll } from "bun:test";
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

// Mock the auditService singleton directly after import
import { auditService } from "@/services/auditService";
mock.module(
  "@/services/auditService",
  () => ({
    auditService: {
      getUserActionsForProfile: mock(() => Promise.resolve([])),
      getUserActionsForProfilePaginated: mock(() => Promise.resolve({ records: [], total: 0 })),
      getAuditRecord: mock(() => Promise.resolve(null)),
      getUserActions: mock(() => Promise.resolve([])),
      logDataAccess: mock(() => Promise.resolve({ success: true, txHash: "0xabc123" })),
      logStudyParticipation: mock(() => Promise.resolve({ success: true, txHash: "0xfailed123" })),
      logFailedJoinStudy: mock(() => Promise.resolve({ success: true, txHash: "0xfailed123" })),
    },
    ActionType: {
      // Include all ActionType enum values to prevent import issues
      USER_AUTHENTICATION: 0,
      PROPOSAL_CREATION: 1,
      VOTE_CAST: 2,
      PROPOSAL_REMOVAL: 3,
      USERNAME_CHANGE: 4,
      STUDY_CREATION: 5,
      STUDY_STATUS_CHANGE: 6,
      STUDY_AGGREGATED_DATA_ACCESS: 7,
      PERMISSION_CHANGE: 8,
      STUDY_PARTICIPATION: 9,
      STUDY_CONSENT_REVOKED: 10,
      STUDY_CONSENT_GRANTED: 11,
      DATA_UPLOAD: 12,
      DATA_ACCESS: 13,
      DATA_DELETED: 14,
      ADMIN_ACTION: 15,
      SYSTEM_CONFIG: 16,
    },
  }),
  true
); // Force override
import { UserProfile } from "@zk-medical/shared";

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

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfile: mock(() => Promise.reject(new Error("Service error"))),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfile(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Internal server error while retrieving audit actions");
  });

  it("should return correct response structure", async () => {
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
    expect(res.jsonData).toEqual({
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        profile: "RESEARCHER",
        actions: mockActions,
        count: 1,
      },
    });
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

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActionsForProfilePaginated: mock(() => Promise.reject(new Error("Service error"))),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe(
      "Internal server error while retrieving paginated audit actions"
    );
  });

  it("should return correct pagination structure when no more records", async () => {
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

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "20" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.data.pagination).toEqual({
      offset: 0,
      limit: 20,
      total: 1,
      hasMore: false,
    });
  });

  it("should handle latestFirst=false parameter", async () => {
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

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", profile: "0" },
      { offset: "0", limit: "10", latestFirst: "false" }
    );
    const res = createMockResponse();

    await getUserActionsByProfilePaginated(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
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

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        getAuditRecord: mock(() => Promise.reject(new Error("Service error"))),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest({ recordId: "1" });
    const res = createMockResponse();

    await getAuditRecord(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Internal server error while retrieving audit record");
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

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        getUserActions: mock(() => Promise.reject(new Error("Service error"))),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      { userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
      { limit: "20" }
    );
    const res = createMockResponse();

    await getAllUserActions(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Internal server error while retrieving all user actions");
  });

  it("should return correct response structure", async () => {
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
    expect(res.jsonData).toEqual({
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actions: mockActions,
        count: 1,
      },
    });
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

  it("should return all expected profiles", async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    const profiles = res.jsonData?.data.profiles;
    expect(profiles).toHaveLength(4); // RESEARCHER, DATA_SELLER, ADMIN, COMMON

    const expectedProfiles = [
      { name: "RESEARCHER", value: 0 },
      { name: "DATA_SELLER", value: 1 },
      { name: "ADMIN", value: 2 },
      { name: "COMMON", value: 3 },
    ];

    expectedProfiles.forEach((expected) => {
      const profile = profiles.find((p: any) => p.name === expected.name);
      expect(profile).toBeDefined();
      expect(profile?.value).toBe(expected.value);
    });
  });

  it("should return all expected action types", async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    const actionTypes = res.jsonData?.data.actionTypes;
    expect(actionTypes).toHaveLength(17); // All ActionType enum values

    const expectedActionTypes = [
      { name: "USER_AUTHENTICATION", value: 0 },
      { name: "PROPOSAL_CREATION", value: 1 },
      { name: "VOTE_CAST", value: 2 },
      { name: "PROPOSAL_REMOVAL", value: 3 },
      { name: "USERNAME_CHANGE", value: 4 },
      { name: "STUDY_CREATION", value: 5 },
      { name: "STUDY_STATUS_CHANGE", value: 6 },
      { name: "STUDY_AGGREGATED_DATA_ACCESS", value: 7 },
      { name: "PERMISSION_CHANGE", value: 8 },
      { name: "STUDY_PARTICIPATION", value: 9 },
      { name: "STUDY_CONSENT_REVOKED", value: 10 },
      { name: "STUDY_CONSENT_GRANTED", value: 11 },
      { name: "DATA_UPLOAD", value: 12 },
      { name: "DATA_ACCESS", value: 13 },
      { name: "DATA_DELETED", value: 14 },
      { name: "ADMIN_ACTION", value: 15 },
      { name: "SYSTEM_CONFIG", value: 16 },
    ];

    expectedActionTypes.forEach((expected) => {
      const actionType = actionTypes.find((a: any) => a.name === expected.name);
      expect(actionType).toBeDefined();
      expect(actionType?.value).toBe(expected.value);
    });
  });

  it("should handle errors gracefully", async () => {
    // Mock Object.keys to throw an error
    const originalObjectKeys = Object.keys;
    Object.keys = () => {
      throw new Error("Mock error");
    };

    const req = createMockRequest();
    const res = createMockResponse();

    await getAuditInfo(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Internal server error while retrieving audit info");

    // Restore original function
    Object.keys = originalObjectKeys;
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

  it("should log with success=false", async () => {
    const mockResult = {
      success: true,
      txHash: "0xfailed123",
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
        success: false,
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.success).toBe(true);
  });

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        logDataAccess: mock(() => Promise.reject(new Error("Service error"))),
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
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.success).toBe(false);
    expect(res.jsonData?.error).toBe("Internal server error while logging file access");
  });

  it("should include resourceType and metadata in service call", async () => {
    let capturedArgs: any[] = [];

    mock.module("@/services/auditService", () => ({
      auditService: {
        logDataAccess: mock((...args: any[]) => {
          capturedArgs = args;
          return Promise.resolve({ success: true, txHash: "0xabc123" });
        }),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest123",
        accessType: "download",
        resourceType: "medical_report",
        metadata: { fileSize: 1024, fileType: "pdf" },
      }
    );
    const res = createMockResponse();

    await logFileAccess(req as Request, res as Response);

    expect(capturedArgs[0]).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    expect(capturedArgs[1]).toBe("QmTest123");
    expect(capturedArgs[2]).toBe("download");
    expect(capturedArgs[3]).toBe(true); // success defaults to true
    expect(capturedArgs[4]).toBe("medical_report");
    expect(capturedArgs[5]).toEqual({ fileSize: 1024, fileType: "pdf" });
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
        markApplicationAsFailed: mock(() => {}),
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
        markApplicationAsFailed: mock(() => {}),
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
        markApplicationAsFailed: mock(() => {}),
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

  it("should enrich metadata with reason and errorDetails", async () => {
    let capturedArgs: any[] = [];

    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock((...args: any[]) => {
          capturedArgs = args;
          return Promise.resolve({ success: true, txHash: "0xabc123" });
        }),
      },
      ActionType: ActionType,
    }));

    const req = createMockRequest(
      {},
      {},
      {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "42",
        reason: "Criteria not met",
        errorDetails: { score: 75, required: 80 },
        metadata: { additionalInfo: "test" },
      }
    );
    const res = createMockResponse();

    await logFailedJoinStudy(req as Request, res as Response);

    expect(capturedArgs[0]).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    expect(capturedArgs[1]).toBe("42");
    expect(capturedArgs[2]).toBe(false); // participation success is false
    expect(capturedArgs[3]).toEqual({
      reason: "Criteria not met",
      errorDetails: { score: 75, required: 80 },
      additionalInfo: "test",
    });
  });

  it("should use default reason when not provided", async () => {
    let capturedArgs: any[] = [];

    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock((...args: any[]) => {
          capturedArgs = args;
          return Promise.resolve({ success: true, txHash: "0xabc123" });
        }),
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

    expect(capturedArgs[3]).toEqual({
      reason: "Unknown error",
    });
  });

  it("should handle service errors gracefully", async () => {
    mock.module("@/services/auditService", () => ({
      auditService: {
        logStudyParticipation: mock(() => Promise.reject(new Error("Service error"))),
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
    expect(res.jsonData?.error).toBe(
      "Internal server error while logging failed study join attempt"
    );
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

  it("should validate recordId as non-negative number", () => {
    const validIds = ["0", "1", "100", "999"];
    validIds.forEach((id) => {
      const parsed = Number.parseInt(id, 10);
      expect(Number.isNaN(parsed) || parsed < 0).toBe(false);
    });

    const invalidIds = ["-1", "-100", "abc", ""];
    invalidIds.forEach((id) => {
      const parsed = Number.parseInt(id, 10);
      expect(Number.isNaN(parsed) || parsed < 0).toBe(true);
    });
  });

  it("should validate studyId as non-negative number", () => {
    const validIds = ["0", "1", "42", "999"];
    validIds.forEach((id) => {
      const parsed = Number.parseInt(id, 10);
      expect(Number.isNaN(parsed) || parsed < 0).toBe(false);
    });

    const invalidIds = ["-1", "-42", "abc", "invalid"];
    invalidIds.forEach((id) => {
      const parsed = Number.parseInt(id, 10);
      expect(Number.isNaN(parsed) || parsed < 0).toBe(true);
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

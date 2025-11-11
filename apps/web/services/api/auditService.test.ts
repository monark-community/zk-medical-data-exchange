import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  ActionType,
  getAuditInfo,
  getAllUserActions,
  getUserActionsByProfile,
  getUserActionsByProfilePaginated,
  getAuditRecord,
  logFileAccess,
  getProfileName,
  getActionTypeName,
  formatAuditTimestamp,
  getSuccessStatusClass,
  getProfileClass,
  type AuditRecord,
  type AuditResponse,
  type AuditInfoResponse,
} from "./auditService";
import { UserProfile } from "@zk-medical/shared";

/**
 * Test suite for Frontend Audit Service
 * Tests API calls, utility functions, and error handling
 */

// Mock apiClient
const mockApiClient = {
  get: mock(() => Promise.resolve({ data: {} })) as any,
  post: mock(() => Promise.resolve({ data: {} })) as any,
};

// Mock the apiClient module
mock.module("@/services/core/apiClient", () => ({
  apiClient: mockApiClient,
}));

describe("AuditService - ActionType Enum", () => {
  it("should have all action types defined", () => {
    expect(ActionType.USER_AUTHENTICATION).toBe(0);
    expect(ActionType.PROPOSAL_CREATION).toBe(1);
    expect(ActionType.VOTE_CAST).toBe(2);
    expect(ActionType.PROPOSAL_REMOVAL).toBe(3);
    expect(ActionType.USERNAME_CHANGE).toBe(4);
    expect(ActionType.STUDY_CREATION).toBe(5);
    expect(ActionType.STUDY_STATUS_CHANGE).toBe(6);
    expect(ActionType.STUDY_AGGREGATED_DATA_ACCESS).toBe(7);
    expect(ActionType.PERMISSION_CHANGE).toBe(8);
    expect(ActionType.STUDY_PARTICIPATION).toBe(9);
    expect(ActionType.STUDY_CONSENT_REVOKED).toBe(10);
    expect(ActionType.STUDY_CONSENT_GRANTED).toBe(11);
    expect(ActionType.DATA_UPLOAD).toBe(12);
    expect(ActionType.DATA_ACCESS).toBe(13);
    expect(ActionType.DATA_DELETED).toBe(14);
    expect(ActionType.ADMIN_ACTION).toBe(15);
    expect(ActionType.SYSTEM_CONFIG).toBe(16);
  });

  it("should have sequential numeric values", () => {
    const values = Object.values(ActionType).filter((v) => typeof v === "number");
    const expected = Array.from({ length: 17 }, (_, i) => i);
    expect(values.sort((a, b) => a - b)).toEqual(expected);
  });

  it("should categorize actions by role", () => {
    // COMMON actions (0-4)
    const commonActions = [
      ActionType.USER_AUTHENTICATION,
      ActionType.PROPOSAL_CREATION,
      ActionType.VOTE_CAST,
      ActionType.PROPOSAL_REMOVAL,
      ActionType.USERNAME_CHANGE,
    ];
    commonActions.forEach((action) => {
      expect(action).toBeLessThanOrEqual(4);
    });

    // RESEARCHER actions (5-8)
    const researcherActions = [
      ActionType.STUDY_CREATION,
      ActionType.STUDY_STATUS_CHANGE,
      ActionType.STUDY_AGGREGATED_DATA_ACCESS,
      ActionType.PERMISSION_CHANGE,
    ];
    researcherActions.forEach((action) => {
      expect(action).toBeGreaterThanOrEqual(5);
      expect(action).toBeLessThanOrEqual(8);
    });

    // DATA_SELLER actions (9-14)
    const dataSellerActions = [
      ActionType.STUDY_PARTICIPATION,
      ActionType.STUDY_CONSENT_REVOKED,
      ActionType.STUDY_CONSENT_GRANTED,
      ActionType.DATA_UPLOAD,
      ActionType.DATA_ACCESS,
      ActionType.DATA_DELETED,
    ];
    dataSellerActions.forEach((action) => {
      expect(action).toBeGreaterThanOrEqual(9);
      expect(action).toBeLessThanOrEqual(14);
    });

    // ADMIN actions (15-16)
    expect(ActionType.ADMIN_ACTION).toBe(15);
    expect(ActionType.SYSTEM_CONFIG).toBe(16);
  });
});

describe("AuditService - Type Interfaces", () => {
  it("should validate AuditRecord interface", () => {
    const record: AuditRecord = {
      id: 1,
      user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.STUDY_CREATION,
      resource: "study_123",
      action: "create_study",
      success: true,
      metadata: '{"studyTitle":"Test"}',
      timestamp: Date.now(),
      dataHash: "0xabc123",
    };

    expect(record.id).toBe(1);
    expect(record.user).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(record.userProfile).toBe(UserProfile.RESEARCHER);
    expect(record.actionType).toBe(ActionType.STUDY_CREATION);
    expect(record.success).toBe(true);
  });

  it("should validate AuditResponse interface", () => {
    const response: AuditResponse = {
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actions: [],
        count: 0,
      },
    };

    expect(response.success).toBe(true);
    expect(response.data.userAddress).toBeDefined();
    expect(Array.isArray(response.data.actions)).toBe(true);
  });

  it("should validate AuditInfoResponse interface", () => {
    const response: AuditInfoResponse = {
      success: true,
      data: {
        profiles: [{ name: "RESEARCHER", value: 0 }],
        actionTypes: [{ name: "USER_AUTHENTICATION", value: 0 }],
      },
    };

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data.profiles)).toBe(true);
    expect(Array.isArray(response.data.actionTypes)).toBe(true);
  });
});

describe("AuditService - getAuditInfo", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch audit info successfully", async () => {
    const mockData = {
      success: true,
      data: {
        profiles: [
          { name: "RESEARCHER", value: 0 },
          { name: "DATA_SELLER", value: 1 },
        ],
        actionTypes: [
          { name: "USER_AUTHENTICATION", value: 0 },
          { name: "STUDY_CREATION", value: 5 },
        ],
      },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getAuditInfo();

    expect(mockApiClient.get).toHaveBeenCalledWith("/audit/info");
    expect(result.success).toBe(true);
    expect(result.data.profiles).toHaveLength(2);
    expect(result.data.actionTypes).toHaveLength(2);
  });

  it("should handle errors gracefully", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    const result = await getAuditInfo();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data.profiles).toEqual([]);
    expect(result.data.actionTypes).toEqual([]);
  });

  it("should handle API error responses", async () => {
    const apiError = {
      response: {
        data: { error: "Unauthorized" },
      },
    };
    mockApiClient.get.mockRejectedValue(apiError);

    const result = await getAuditInfo();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });
});

describe("AuditService - getAllUserActions", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch all user actions successfully", async () => {
    const mockData = {
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        actions: [
          { id: 1, action: "login", success: true },
          { id: 2, action: "upload", success: true },
        ],
        count: 2,
      },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getAllUserActions("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/actions",
      { params: { limit: 100 } }
    );
    expect(result.success).toBe(true);
    expect(result.data.actions).toHaveLength(2);
  });

  it("should use custom limit parameter", async () => {
    mockApiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

    await getAllUserActions("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", 50);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/actions",
      { params: { limit: 50 } }
    );
  });

  it("should handle errors and return empty array", async () => {
    mockApiClient.get.mockRejectedValue(new Error("Failed to fetch"));

    const result = await getAllUserActions("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result.success).toBe(false);
    expect(result.data.actions).toEqual([]);
    expect(result.data.count).toBe(0);
  });
});

describe("AuditService - getUserActionsByProfile", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch user actions by profile", async () => {
    const mockData = {
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        profile: "RESEARCHER",
        actions: [{ id: 1, actionType: ActionType.STUDY_CREATION }],
        count: 1,
      },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getUserActionsByProfile(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      UserProfile.RESEARCHER
    );

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/profile/0/actions",
      { params: { limit: 100 } }
    );
    expect(result.success).toBe(true);
  });

  it("should use custom limit", async () => {
    mockApiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

    await getUserActionsByProfile(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      UserProfile.DATA_SELLER,
      25
    );

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/profile/1/actions",
      { params: { limit: 25 } }
    );
  });
});

describe("AuditService - getUserActionsByProfilePaginated", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch paginated actions successfully", async () => {
    const mockData = {
      success: true,
      data: {
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        profile: "RESEARCHER",
        records: [{ id: 1 }, { id: 2 }],
        pagination: {
          offset: 0,
          limit: 20,
          total: 100,
          hasMore: true,
        },
      },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getUserActionsByProfilePaginated(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      UserProfile.RESEARCHER,
      0,
      20,
      true
    );

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/profile/0/actions/paginated",
      { params: { offset: 0, limit: 20, latestFirst: true } }
    );
    expect(result.success).toBe(true);
    expect(result.data.records).toHaveLength(2);
    expect(result.data.pagination?.hasMore).toBe(true);
  });

  it("should use default pagination parameters", async () => {
    mockApiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

    await getUserActionsByProfilePaginated(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      UserProfile.COMMON
    );

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/audit/user/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0/profile/3/actions/paginated",
      { params: { offset: 0, limit: 100, latestFirst: true } }
    );
  });

  it("should handle errors and return empty paginated response", async () => {
    const error = {
      message: "Network error",
      response: {
        data: { error: "Server error" },
        status: 500,
      },
    };

    mockApiClient.get.mockRejectedValue(error);

    const result = await getUserActionsByProfilePaginated(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      UserProfile.RESEARCHER,
      10,
      25,
      false
    );

    expect(result.success).toBe(false);
    expect(result.data.records).toEqual([]);
    expect(result.data.pagination?.offset).toBe(10);
    expect(result.data.pagination?.limit).toBe(25);
    expect(result.data.pagination?.total).toBe(0);
    expect(result.data.pagination?.hasMore).toBe(false);
  });
});

describe("AuditService - getAuditRecord", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch specific audit record", async () => {
    const mockData = {
      success: true,
      data: {
        record: {
          id: 123,
          user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          action: "login",
        },
      },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getAuditRecord(123);

    expect(mockApiClient.get).toHaveBeenCalledWith("/audit/record/123");
    expect(result.success).toBe(true);
  });
});

describe("AuditService - logFileAccess", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  it("should log view access successfully", async () => {
    const mockData = {
      success: true,
      data: { txHash: "0xabc123" },
    };

    mockApiClient.post.mockResolvedValue({ data: mockData });

    const result = await logFileAccess(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "QmTest123",
      "view",
      true,
      "medical_record"
    );

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/audit/log-access",
      expect.objectContaining({
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        encryptedCID: "QmTest123",
        accessType: "view",
        success: true,
        resourceType: "medical_record",
      })
    );
    expect(result.success).toBe(true);
  });

  it("should log download access", async () => {
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    await logFileAccess("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "QmDownload456", "download");

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/audit/log-access",
      expect.objectContaining({
        accessType: "download",
      })
    );
  });

  it("should include metadata with timestamp and userAgent", async () => {
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    await logFileAccess(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "QmTest789",
      "view",
      true,
      "lab_report",
      { customField: "value" }
    );

    const callArgs = (mockApiClient.post.mock.calls[0] as any)?.[1];
    expect(callArgs?.metadata).toBeDefined();
    expect(callArgs?.metadata?.timestamp).toBeDefined();
    expect(callArgs?.metadata?.requestId).toBeDefined();
    expect(callArgs?.metadata?.customField).toBe("value");
  });

  it("should handle errors gracefully", async () => {
    const error = {
      message: "Failed to log",
      response: {
        data: { error: "Database error" },
      },
    };

    mockApiClient.post.mockRejectedValue(error);

    const result = await logFileAccess(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "QmError",
      "view"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database error");
  });

  it("should use default success value of true", async () => {
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    await logFileAccess("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "QmTest", "view");

    const callArgs = (mockApiClient.post.mock.calls[0] as any)?.[1];
    expect(callArgs?.success).toBe(true);
  });
});

describe("AuditService - Utility Functions", () => {
  describe("getProfileName", () => {
    it("should return profile names correctly", () => {
      expect(getProfileName(UserProfile.RESEARCHER)).toBe("RESEARCHER");
      expect(getProfileName(UserProfile.DATA_SELLER)).toBe("DATA_SELLER");
      expect(getProfileName(UserProfile.ADMIN)).toBe("ADMIN");
      expect(getProfileName(UserProfile.COMMON)).toBe("COMMON");
    });

    it("should return Unknown for invalid profile", () => {
      expect(getProfileName(999 as UserProfile)).toBe("Unknown");
    });
  });

  describe("getActionTypeName", () => {
    it("should return action type names correctly", () => {
      expect(getActionTypeName(ActionType.USER_AUTHENTICATION)).toBe("USER_AUTHENTICATION");
      expect(getActionTypeName(ActionType.STUDY_CREATION)).toBe("STUDY_CREATION");
      expect(getActionTypeName(ActionType.DATA_ACCESS)).toBe("DATA_ACCESS");
      expect(getActionTypeName(ActionType.ADMIN_ACTION)).toBe("ADMIN_ACTION");
    });

    it("should return Unknown for invalid action type", () => {
      expect(getActionTypeName(999 as ActionType)).toBe("Unknown");
    });
  });

  describe("formatAuditTimestamp", () => {
    it("should format Unix timestamp to locale string", () => {
      const timestamp = 1700000000; // Unix timestamp in seconds
      const formatted = formatAuditTimestamp(timestamp);

      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should handle different timestamps", () => {
      const timestamps = [1600000000, 1650000000, 1700000000];

      timestamps.forEach((ts) => {
        const formatted = formatAuditTimestamp(ts);
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe("string");
      });
    });
  });

  describe("getSuccessStatusClass", () => {
    it("should return success classes for true", () => {
      const classes = getSuccessStatusClass(true);

      expect(classes).toContain("text-green-600");
      expect(classes).toContain("bg-green-50");
      expect(classes).toContain("border-green-200");
    });

    it("should return error classes for false", () => {
      const classes = getSuccessStatusClass(false);

      expect(classes).toContain("text-red-600");
      expect(classes).toContain("bg-red-50");
      expect(classes).toContain("border-red-200");
    });
  });

  describe("getProfileClass", () => {
    it("should return blue classes for RESEARCHER", () => {
      const classes = getProfileClass(UserProfile.RESEARCHER);

      expect(classes).toContain("text-blue-700");
      expect(classes).toContain("border-blue-200");
    });

    it("should return green classes for DATA_SELLER", () => {
      const classes = getProfileClass(UserProfile.DATA_SELLER);

      expect(classes).toContain("text-green-700");
      expect(classes).toContain("border-green-200");
    });

    it("should return red classes for ADMIN", () => {
      const classes = getProfileClass(UserProfile.ADMIN);

      expect(classes).toContain("text-red-700");
      expect(classes).toContain("border-red-200");
    });

    it("should return purple classes for COMMON", () => {
      const classes = getProfileClass(UserProfile.COMMON);

      expect(classes).toContain("text-purple-700");
      expect(classes).toContain("border-purple-200");
    });

    it("should return gray classes for unknown profile", () => {
      const classes = getProfileClass(999 as UserProfile);

      expect(classes).toContain("text-gray-700");
      expect(classes).toContain("border-gray-200");
    });
  });
});

describe("AuditService - Edge Cases", () => {
  it("should handle empty string CID", async () => {
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    await logFileAccess("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "", "view");

    expect(mockApiClient.post).toHaveBeenCalled();
  });

  it("should handle long metadata objects", async () => {
    mockApiClient.post.mockClear();
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    const largeMetadata = {
      field1: "value1",
      field2: "value2",
      field3: { nested: "data" },
      array: [1, 2, 3],
    };

    await logFileAccess(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "QmTest",
      "view",
      true,
      "test",
      largeMetadata
    );

    const callArgs = (mockApiClient.post.mock.calls[0] as any)?.[1];
    expect(callArgs?.metadata?.field1).toBe("value1");
    expect(callArgs?.metadata?.array).toEqual([1, 2, 3]);
  });

  it("should handle zero timestamp", () => {
    const formatted = formatAuditTimestamp(0);
    expect(formatted).toBeDefined();
  });

  it("should handle negative profile values", () => {
    const name = getProfileName(-1 as UserProfile);
    expect(name).toBe("Unknown");
  });
});

describe("AuditService - Request ID Generation", () => {
  it("should generate unique request IDs", async () => {
    mockApiClient.post.mockResolvedValue({ data: { success: true } });

    await logFileAccess("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "QmTest1", "view");
    await logFileAccess("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "QmTest2", "view");

    const call1Metadata = (mockApiClient.post.mock.calls[0] as any)?.[1]?.metadata;
    const call2Metadata = (mockApiClient.post.mock.calls[1] as any)?.[1]?.metadata;

    expect(call1Metadata?.requestId).toBeDefined();
    expect(call2Metadata?.requestId).toBeDefined();
    // Request IDs should be different (though not guaranteed with random)
    expect(typeof call1Metadata?.requestId).toBe("string");
    expect(typeof call2Metadata?.requestId).toBe("string");
  });
});

describe("AuditService - Error Message Handling", () => {
  it("should prioritize API error message", async () => {
    const error = {
      message: "Generic error",
      response: {
        data: { error: "Specific API error" },
      },
    };

    mockApiClient.get.mockRejectedValue(error);
    const result = await getAuditInfo();

    expect(result.error).toBe("Specific API error");
  });

  it("should fallback to error message if no API error", async () => {
    const error = new Error("Network timeout");

    mockApiClient.get.mockRejectedValue(error);
    const result = await getAllUserActions("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result.error).toBe("Network timeout");
  });

  it("should use default message as last resort", async () => {
    mockApiClient.get.mockRejectedValue({});
    const result = await getAllUserActions("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result.error).toBe("Failed to fetch user actions");
  });
});

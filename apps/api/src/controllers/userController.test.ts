import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Request, Response } from "express";
import { UserProfile } from "@zk-medical/shared";

// Mock logger methods
const mockLoggerInfo = mock(() => {});
const mockLoggerDebug = mock(() => {});
const mockLoggerError = mock(() => {});

// Mock the logger before any imports
const loggerMock = {
  default: {
    info: mockLoggerInfo,
    debug: mockLoggerDebug,
    error: mockLoggerError,
  },
};

// Mock all possible import paths
mock.module("@/utils/logger", () => loggerMock);
mock.module("../utils/logger", () => loggerMock);
mock.module("./logger", () => loggerMock);

// Mock service functions
const mockCheckIfUserExists = mock(async () => true);
const mockGetNumberOfUsersOnPlatform = mock(async () => 100);
const mockGetUserByWalletAddress = mock(async () => ({
  id: "0x1234567890123456789012345678901234567890",
  username: "testuser",
  created_at: "2024-01-01T00:00:00Z",
}));
const mockGetUserStatsForDataSeller = mock(async () => ({
  nActiveStudies: 2,
  nCompletedStudies: 1,
  nMedicalFiles: 5,
  totalEarnings: 1000,
}));
const mockGetUserStatsForResearcher = mock(async () => ({
  nActiveStudies: 3,
  nParticipantsEnrolled: 10,
  nCompletedStudies: 2,
  totalSpent: 5000,
}));
const mockUpdateUserByWalletAddress = mock(async () => ({
  id: "0x1234567890123456789012345678901234567890",
  username: "newusername",
  created_at: "2024-01-01T00:00:00Z",
}));

mock.module("@/services/userService", () => ({
  checkIfUserExists: mockCheckIfUserExists,
  getNumberOfUsersOnPlatform: mockGetNumberOfUsersOnPlatform,
  getUserByWalletAddress: mockGetUserByWalletAddress,
  getUserStatsForDataSeller: mockGetUserStatsForDataSeller,
  getUserStatsForResearcher: mockGetUserStatsForResearcher,
  updateUserByWalletAddress: mockUpdateUserByWalletAddress,
}));

// Mock address validation
const mockIsValidEthereumAddress = mock(() => true);
mock.module("@/utils/address", () => ({
  default: mockIsValidEthereumAddress,
}));

// Mock auditService
const mockLogUsernameChange = mock(async () => ({ success: true, txHash: "0x123" }));
mock.module("@/services/auditService", () => ({
  auditService: {
    logUsernameChange: mockLogUsernameChange,
  },
}));

// NOW import the controller after all mocks are set up
import { getUserById, updateUser, getUserStats, getPlatformUserCount } from "./userController";

// Helper function to create mock request
function createMockRequest(walletAddress?: string, body?: any, profile?: string): Partial<Request> {
  return {
    params: {
      walletAddress,
      profile,
    } as any,
    body: body || {},
    supabase: {} as any,
    get: ((header: string) => {
      if (header === "User-Agent") return "Mozilla/5.0 Test Browser";
      return undefined;
    }) as any,
    ip: "192.168.1.1",
    socket: {
      remoteAddress: "192.168.1.1",
    } as any,
  };
}

// Helper function to create mock response
function createMockResponse(): Partial<Response> {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: any) {
      this.jsonData = data;
      return this;
    }),
  };
  return res;
}

describe("userController", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockLoggerInfo.mockReset();
    mockLoggerDebug.mockReset();
    mockLoggerError.mockReset();
    mockCheckIfUserExists.mockReset();
    mockGetNumberOfUsersOnPlatform.mockReset();
    mockGetUserByWalletAddress.mockReset();
    mockGetUserStatsForDataSeller.mockReset();
    mockGetUserStatsForResearcher.mockReset();
    mockUpdateUserByWalletAddress.mockReset();
    mockIsValidEthereumAddress.mockReset();
    mockLogUsernameChange.mockReset();

    // Set default mock implementations
    mockCheckIfUserExists.mockImplementation(async () => true);
    mockGetNumberOfUsersOnPlatform.mockImplementation(async () => 100);
    mockGetUserByWalletAddress.mockImplementation(async () => ({
      id: "0x1234567890123456789012345678901234567890",
      username: "testuser",
      created_at: "2024-01-01T00:00:00Z",
    }));
    mockGetUserStatsForDataSeller.mockImplementation(async () => ({
      nActiveStudies: 2,
      nCompletedStudies: 1,
      nMedicalFiles: 5,
      totalEarnings: 1000,
    }));
    mockGetUserStatsForResearcher.mockImplementation(async () => ({
      nActiveStudies: 3,
      nParticipantsEnrolled: 10,
      nCompletedStudies: 2,
      totalSpent: 5000,
    }));
    mockUpdateUserByWalletAddress.mockImplementation(async () => ({
      id: "0x1234567890123456789012345678901234567890",
      username: "newusername",
      created_at: "2024-01-01T00:00:00Z",
    }));
    mockIsValidEthereumAddress.mockImplementation(() => true);
    mockLogUsernameChange.mockImplementation(async () => ({ success: true, txHash: "0x123" }));
  });

  describe("getUserById", () => {
    test("should return 400 if walletAddress is undefined", async () => {
      const req = createMockRequest(undefined) as Request;
      const res = createMockResponse() as Response;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "walletAddress is undefined" });
    });

    test("should return 404 if user not found", async () => {
      mockGetUserByWalletAddress.mockImplementation(async () => null as any);
      const req = createMockRequest("0x1234567890123456789012345678901234567890") as Request;
      const res = createMockResponse() as Response;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("should return user data successfully", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const req = createMockRequest(walletAddress) as Request;
      const res = createMockResponse() as Response;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: walletAddress,
        username: "testuser",
        createdAt: "2024-01-01T00:00:00Z",
      });
    });

    test("should handle unexpected errors", async () => {
      mockGetUserByWalletAddress.mockImplementation(async () => {
        throw new Error("Database error");
      });
      const req = createMockRequest("0x1234567890123456789012345678901234567890") as Request;
      const res = createMockResponse() as Response;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    test("should return 400 if walletAddress is undefined", async () => {
      const req = createMockRequest(undefined, { username: "newname" }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "walletAddress param is required" });
    });

    test("should return 400 if no update data provided", async () => {
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {}) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "No update data provided" });
    });

    test("should return 404 if user not found", async () => {
      mockCheckIfUserExists.mockImplementation(async () => false);
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {
        username: "newname",
      }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("should update user successfully", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const req = createMockRequest(walletAddress, { username: "newusername" }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(mockUpdateUserByWalletAddress).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: walletAddress,
        username: "newusername",
        createdAt: "2024-01-01T00:00:00Z",
      });
    });

    test("should log username change audit event", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const req = createMockRequest(walletAddress, { username: "newusername" }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      // Give async audit logging time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockLogUsernameChange).toHaveBeenCalled();
    });

    test("should return 500 if update fails", async () => {
      mockUpdateUserByWalletAddress.mockImplementation(async () => null as any);
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {
        username: "newusername",
      }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to update user" });
    });

    test("should return 400 for invalid username format", async () => {
      mockUpdateUserByWalletAddress.mockImplementation(async () => {
        throw new Error("Invalid username format");
      });
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {
        username: "ab",
      }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid username format" });
    });

    test("should handle unexpected errors", async () => {
      mockCheckIfUserExists.mockImplementation(async () => {
        throw new Error("Database error");
      });
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {
        username: "newname",
      }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLoggerError).toHaveBeenCalled();
    });

    test("should not log audit event if username unchanged", async () => {
      mockGetUserByWalletAddress.mockImplementation(async () => ({
        id: "0x1234567890123456789012345678901234567890",
        username: "samename",
        created_at: "2024-01-01T00:00:00Z",
      }));
      mockUpdateUserByWalletAddress.mockImplementation(async () => ({
        id: "0x1234567890123456789012345678901234567890",
        username: "samename",
        created_at: "2024-01-01T00:00:00Z",
      }));
      const req = createMockRequest("0x1234567890123456789012345678901234567890", {
        username: "samename",
      }) as Request;
      const res = createMockResponse() as Response;

      await updateUser(req, res);

      // Give async audit logging time to complete (if it were to be called)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Username change logging should not be called since name didn't change
      expect(mockLogUsernameChange).not.toHaveBeenCalled();
    });
  });

  describe("getUserStats", () => {
    test("should return 400 for invalid wallet address format", async () => {
      mockIsValidEthereumAddress.mockImplementation(() => false);
      const req = createMockRequest("invalid-address", undefined, "DATA_SELLER") as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid wallet address format" });
    });

    test("should return 400 for invalid profile", async () => {
      const req = createMockRequest(
        "0x1234567890123456789012345678901234567890",
        undefined,
        "INVALID_PROFILE"
      ) as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid profile. Must be one of: DATA_SELLER, RESEARCHER",
      });
    });

    test("should return 400 for missing profile", async () => {
      const req = createMockRequest(
        "0x1234567890123456789012345678901234567890",
        undefined
      ) as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid profile. Must be one of: DATA_SELLER, RESEARCHER",
      });
    });

    test("should return data seller stats successfully", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const req = createMockRequest(walletAddress, undefined, "DATA_SELLER") as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(mockGetUserStatsForDataSeller).toHaveBeenCalledWith({}, walletAddress);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        nActiveStudies: 2,
        nCompletedStudies: 1,
        nMedicalFiles: 5,
        totalEarnings: 1000,
      });
    });

    test("should return researcher stats successfully", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const req = createMockRequest(walletAddress, undefined, "RESEARCHER") as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(mockGetUserStatsForResearcher).toHaveBeenCalledWith({}, walletAddress);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        nActiveStudies: 3,
        nParticipantsEnrolled: 10,
        nCompletedStudies: 2,
        totalSpent: 5000,
      });
    });

    test("should handle unexpected errors", async () => {
      mockGetUserStatsForDataSeller.mockImplementation(async () => {
        throw new Error("Database error");
      });
      const req = createMockRequest(
        "0x1234567890123456789012345678901234567890",
        undefined,
        "DATA_SELLER"
      ) as Request;
      const res = createMockResponse() as Response;

      await getUserStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe("getPlatformUserCount", () => {
    test("should return platform user count successfully", async () => {
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      await getPlatformUserCount(req, res);

      expect(mockGetNumberOfUsersOnPlatform).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 100 });
    });

    test("should handle unexpected errors", async () => {
      mockGetNumberOfUsersOnPlatform.mockImplementation(async () => {
        throw new Error("Database error");
      });
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;

      await getPlatformUserCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });
});

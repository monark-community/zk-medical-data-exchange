import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Request, Response } from "express";

// Mock dependencies BEFORE importing the controller
// This is crucial because modules import logger at the top level

// Mock logger methods (these need to be defined for test assertions)
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

// Mock dependencies use in auth controller
const mockGenerateSessionToken = mock(() => "mock-session-token");
const mockCheckIfUserExists = mock(async () => true);
const mockCreateUser = mock(async () => true);
const mockLogAuthentication = mock(async () => ({ success: true, txHash: "0x123" }));

// Replace the real functions with mocks to isolates and encapsulate the tests
mock.module("@/utils/sessionManager", () => ({
  generateSessionToken: mockGenerateSessionToken,
}));

mock.module("@/services/userService", () => ({
  checkIfUserExists: mockCheckIfUserExists,
  createUser: mockCreateUser,
}));

// Mock the auditService const export
mock.module("@/services/auditService", () => ({
  auditService: {
    logAuthentication: mockLogAuthentication,
  },
}));

// NOW import the controller and types after all mocks are set up
import { verifyAuthentication } from "./authController";
import type { Web3AuthUser } from "../middleware/web3AuthMiddleware";

// Helper function to create mock request
function createMockRequest(web3AuthUser?: Web3AuthUser): Partial<Request> {
  return {
    web3AuthUser,
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

describe("authController", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGenerateSessionToken.mockClear();
    mockCheckIfUserExists.mockClear();
    mockCreateUser.mockClear();
    mockLogAuthentication.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerDebug.mockClear();
    mockLoggerError.mockClear();

    // Reset mock return values
    mockGenerateSessionToken.mockReturnValue("mock-session-token");
    mockCheckIfUserExists.mockResolvedValue(true);
    mockCreateUser.mockResolvedValue(true);
    mockLogAuthentication.mockResolvedValue({ success: true, txHash: "0x123" });
  });

  describe("verifyAuthentication", () => {
    test("should successfully authenticate user with existing account", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockGenerateSessionToken).toHaveBeenCalledTimes(1);
      expect(mockGenerateSessionToken).toHaveBeenCalledWith(mockWeb3AuthUser);
      expect(mockCheckIfUserExists).toHaveBeenCalledTimes(1);
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect((res as any).statusCode).toBe(200);
      expect((res as any).jsonData).toEqual({
        success: true,
        sessionToken: "mock-session-token",
        walletAddress: "0x1234567890123456789012345678901234567890",
      });
      expect(mockLogAuthentication).toHaveBeenCalledTimes(1);
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        true,
        expect.objectContaining({
          userAgent: "Mozilla/5.0 Test Browser",
          ipAddress: "192.168.1.1",
          sessionTokenGenerated: true,
          userCreated: false,
        })
      );
    });

    test("should successfully authenticate and create new user", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0xABCDEF1234567890123456789012345678901234",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockGenerateSessionToken).toHaveBeenCalledTimes(1);
      expect(mockCheckIfUserExists).toHaveBeenCalledTimes(1);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
      expect(mockCreateUser).toHaveBeenCalledWith(
        req,
        res,
        "0xABCDEF1234567890123456789012345678901234"
      );
      expect((res as any).statusCode).toBe(200);
      expect((res as any).jsonData).toEqual({
        success: true,
        sessionToken: "mock-session-token",
        walletAddress: "0xABCDEF1234567890123456789012345678901234",
      });
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0xABCDEF1234567890123456789012345678901234",
        true,
        expect.objectContaining({
          userCreated: true,
        })
      );
    });

    test("should return 401 when web3AuthUser is missing", async () => {
      const req = createMockRequest(undefined) as Request;
      const res = createMockResponse() as Response;

      await verifyAuthentication(req, res);

      expect(mockGenerateSessionToken).not.toHaveBeenCalled();
      expect(mockCheckIfUserExists).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect((res as any).statusCode).toBe(401);
      expect((res as any).jsonData).toEqual({
        error: "Unauthorized",
        message: "User data not found",
      });
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "unknown",
        false,
        expect.objectContaining({
          reason: "missing_web3auth_user",
        })
      );
    });

    test("should handle missing wallet address gracefully", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(false);

      await verifyAuthentication(req, res);

      expect(mockCheckIfUserExists).toHaveBeenCalledWith(req, res, "");
      expect((res as any).statusCode).toBe(200);
      expect((res as any).jsonData.walletAddress).toBe("");
    });

    test("should handle undefined wallets array", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: undefined,
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockGenerateSessionToken).toHaveBeenCalledWith(mockWeb3AuthUser);
      expect((res as any).statusCode).toBe(200);
      expect((res as any).jsonData.walletAddress).toBe("");
    });

    test("should return 500 on unexpected error", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      const errorMessage = "Database connection failed";
      mockCheckIfUserExists.mockRejectedValue(new Error(errorMessage));

      await verifyAuthentication(req, res);

      expect((res as any).statusCode).toBe(500);
      expect((res as any).jsonData).toEqual({
        error: "Internal server error",
        message: "Failed to create session",
      });
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        false,
        expect.objectContaining({
          error: errorMessage,
        })
      );
    });

    test("should handle missing User-Agent header", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req: Partial<Request> = {
        web3AuthUser: mockWeb3AuthUser,
        get: (() => undefined) as any,
        ip: "192.168.1.1",
        socket: {
          remoteAddress: "192.168.1.1",
        } as any,
      };
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req as Request, res);

      expect((res as any).statusCode).toBe(200);
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        true,
        expect.objectContaining({
          userAgent: "",
        })
      );
    });

    test("should handle missing IP address", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req: Partial<Request> = {
        web3AuthUser: mockWeb3AuthUser,
        get: (() => "Mozilla/5.0 Test Browser") as any,
        ip: undefined,
        socket: undefined as any,
      };
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req as Request, res);

      expect((res as any).statusCode).toBe(200);
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        true,
        expect.objectContaining({
          ipAddress: "",
        })
      );
    });

    test("should log audit event even when audit logging fails", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);
      mockLogAuthentication.mockRejectedValue(new Error("Audit service unavailable"));

      await verifyAuthentication(req, res);

      // Authentication should still succeed even if audit logging fails
      expect((res as any).statusCode).toBe(200);
      expect((res as any).jsonData).toEqual({
        success: true,
        sessionToken: "mock-session-token",
        walletAddress: "0x1234567890123456789012345678901234567890",
      });
    });

    test("should handle error during session token generation", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockGenerateSessionToken.mockImplementation(() => {
        throw new Error("Session generation failed");
      });

      await verifyAuthentication(req, res);

      expect((res as any).statusCode).toBe(500);
      expect((res as any).jsonData).toEqual({
        error: "Internal server error",
        message: "Failed to create session",
      });
    });

    test("should track duration in audit log", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        true,
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );

      const auditCall = mockLogAuthentication.mock.calls[0] as any[];
      expect(auditCall).toBeDefined();
      const auditMetadata = auditCall[2] as any;
      expect(auditMetadata).toBeDefined();
      expect(auditMetadata.duration).toBeGreaterThanOrEqual(0);
    });

    test("should use socket.remoteAddress when req.ip is not available", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req: Partial<Request> = {
        web3AuthUser: mockWeb3AuthUser,
        get: (() => "Mozilla/5.0 Test Browser") as any,
        ip: undefined,
        socket: {
          remoteAddress: "10.0.0.1",
        } as any,
      };
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req as Request, res);

      expect((res as any).statusCode).toBe(200);
      expect(mockLogAuthentication).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        true,
        expect.objectContaining({
          ipAddress: "10.0.0.1",
        })
      );
    });

    test("should call logger.info when authentication starts", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockLoggerInfo).toHaveBeenCalledWith("Authentication verification endpoint called");
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        {
          walletAddress: "0x1234567890123456789012345678901234567890",
        },
        "Session created successfully"
      );
    });

    test("should call logger.debug during token generation", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);

      await verifyAuthentication(req, res);

      expect(mockLoggerDebug).toHaveBeenCalledWith(
        {
          hasWallets: true,
        },
        "Generating session token for user"
      );
    });

    test("should call logger.error when web3AuthUser is missing", async () => {
      const req = createMockRequest(undefined) as Request;
      const res = createMockResponse() as Response;

      await verifyAuthentication(req, res);

      expect(mockLoggerError).toHaveBeenCalledWith(
        "Web3AuthUser not found in request after middleware verification"
      );
    });

    test("should call logger.error on authentication failure", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      const errorMessage = "Database connection failed";
      const testError = new Error(errorMessage);
      mockCheckIfUserExists.mockRejectedValue(testError);

      await verifyAuthentication(req, res);

      expect(mockLoggerError).toHaveBeenCalledWith(
        { error: testError },
        "Authentication verification error"
      );
    });

    test("should log error when audit logging fails on success", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      mockCheckIfUserExists.mockResolvedValue(true);
      const auditError = new Error("Audit service unavailable");
      mockLogAuthentication.mockRejectedValue(auditError);

      await verifyAuthentication(req, res);

      // Wait a bit for the async catch to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLoggerError).toHaveBeenCalledWith(
        { error: auditError },
        "Failed to log successful authentication audit event"
      );
    });

    test("should log error when audit logging fails on missing user", async () => {
      const req = createMockRequest(undefined) as Request;
      const res = createMockResponse() as Response;

      const auditError = new Error("Audit service unavailable");
      mockLogAuthentication.mockRejectedValue(auditError);

      await verifyAuthentication(req, res);

      // Wait a bit for the async catch to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLoggerError).toHaveBeenCalledWith(
        { error: auditError },
        "Failed to log authentication audit event"
      );
    });

    test("should log error when audit logging fails during error handling", async () => {
      const mockWeb3AuthUser: Web3AuthUser = {
        iss: "metamask",
        aud: "localhost",
        exp: Date.now() + 3600000,
        iat: Date.now(),
        wallets: [
          {
            address: "0x1234567890123456789012345678901234567890",
            type: "evm",
          },
        ],
      };

      const req = createMockRequest(mockWeb3AuthUser) as Request;
      const res = createMockResponse() as Response;

      // First make checkIfUserExists throw an error to trigger catch block
      const checkError = new Error("Database connection failed");
      mockCheckIfUserExists.mockRejectedValue(checkError);

      // Then make audit logging also fail
      const auditError = new Error("Audit service also unavailable");
      mockLogAuthentication.mockRejectedValue(auditError);

      await verifyAuthentication(req, res);

      // Wait for async catch to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have called logger.error for the main error
      expect(mockLoggerError).toHaveBeenCalledWith(
        { error: checkError },
        "Authentication verification error"
      );

      // And also for the audit logging failure
      expect(mockLoggerError).toHaveBeenCalledWith(
        { auditError },
        "Failed to log authentication audit event"
      );
    });
  });
});

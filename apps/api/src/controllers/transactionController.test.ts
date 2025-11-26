import { describe, it, expect, mock, afterEach, beforeEach } from "bun:test";
import type { Request, Response } from "express";

afterEach(() => {
  mock.restore();
});

// Mock data
const mockTransaction = {
  id: 1,
  transaction_hash: "0xabc123",
  from_wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  to_wallet: "0x1234567890123456789012345678901234567890",
  value: 0.001,
  value_usd: 2.5,
  study_id: 1,
  created_at: new Date().toISOString(),
};

const mockStudy = {
  id: 1,
  created_by: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  current_participants: 5,
  status: "active",
  contract_address: "0x1234567890123456789012345678901234567890",
};

const mockParticipation = {
  study_id: 1,
  participant_wallet: "0x1111111111111111111111111111111111111111",
};

const mockTransactionReceipt = {
  status: "success" as const,
  transactionHash: "0xabc123",
  blockNumber: 12345n,
  gasUsed: 21000n,
};

const mockTransactionData = {
  hash: "0xabc123",
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  to: "0x1234567890123456789012345678901234567890",
  value: 5000000000000000n, // 0.005 ETH (5 participants * 0.001 ETH)
  chainId: 11155111,
};

// Mock logger
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
};

mock.module("@/utils/logger", () => ({
  default: mockLogger,
}));

// Mock viem functions - create shared mock client
const mockWaitForTransactionReceipt = mock(() => Promise.resolve(mockTransactionReceipt));
const mockGetTransaction = mock(() => Promise.resolve(mockTransactionData));

const mockPublicClient = {
  waitForTransactionReceipt: mockWaitForTransactionReceipt,
  getTransaction: mockGetTransaction,
};

const mockCreatePublicClient = mock(() => mockPublicClient);
const mockParseEther = mock((value: string) => BigInt(value) * 1000000000000000000n);

mock.module("viem", () => ({
  createPublicClient: mockCreatePublicClient,
  http: mock(() => ({})),
  parseEther: mockParseEther,
}));

mock.module("viem/chains", () => ({
  sepolia: { id: 11155111 },
}));

// Mock audit service
const mockAuditService = {
  logStudyCompletion: mock(() => Promise.resolve()),
  logCompensationSent: mock(() => Promise.resolve()),
};

mock.module("@/services/auditService", () => ({
  auditService: mockAuditService,
}));

// Mock fetch for Ethereum price
const mockFetch = mock(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ethereum: { usd: 2500 } }),
  })
);
global.fetch = mockFetch as any;

// Import after mocks
import {
  getTransactionsByStudyId,
  getTransactionByWalletAddress,
  verifyTransaction,
  getEthereumPriceUSD,
} from "./transactionController";

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  supabase: {} as any,
  ...overrides,
});

const createMockResponse = (): Partial<Response> => {
  const res: any = {
    status: mock(() => res),
    json: mock(() => res),
    send: mock(() => res),
  };
  return res;
};

describe("TransactionController - Comprehensive Coverage Tests", () => {
  beforeEach(() => {
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockAuditService.logStudyCompletion.mockClear();
    mockAuditService.logCompensationSent.mockClear();

    // Reset to default implementations
    mockWaitForTransactionReceipt.mockClear();
    mockWaitForTransactionReceipt.mockResolvedValue(mockTransactionReceipt);

    mockGetTransaction.mockClear();
    mockGetTransaction.mockResolvedValue(mockTransactionData);

    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ethereum: { usd: 2500 } }),
    } as any);
  });

  describe("getEthereumPriceUSD", () => {
    it("should fetch and return Ethereum price in USD", async () => {
      const price = await getEthereumPriceUSD();

      expect(price).toBe(2500);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
    });

    it("should handle fetch error with error message", async () => {
      const errorResponse = {
        response: {
          data: {
            error: "Rate limit exceeded",
          },
        },
      };

      mockFetch.mockRejectedValueOnce(errorResponse);

      await expect(getEthereumPriceUSD()).rejects.toThrow(
        "Failed to fetch Ethereum price: Rate limit exceeded"
      );
    });

    it("should handle fetch error without response data", async () => {
      const error = new Error("Network error");
      mockFetch.mockRejectedValueOnce(error);

      await expect(getEthereumPriceUSD()).rejects.toThrow(
        "Failed to fetch Ethereum price: Network error"
      );
    });

    it("should handle unknown error", async () => {
      mockFetch.mockRejectedValueOnce("Unknown error string");

      await expect(getEthereumPriceUSD()).rejects.toThrow(
        "Failed to fetch Ethereum price: Unknown error"
      );
    });
  });

  describe("getTransactionsByStudyId", () => {
    it("should handle unexpected error", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected error");
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await getTransactionsByStudyId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("getTransactionByWalletAddress", () => {
    it("should handle unexpected error", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected error");
        }),
      };

      const req = createMockRequest({
        params: { walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await getTransactionByWalletAddress(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("verifyTransaction", () => {
    it("should return 400 when studyId or transactionHash is missing", async () => {
      const req1 = createMockRequest({ body: { data: { transactionHash: "0xabc123" } } });
      const res1 = createMockResponse();
      await verifyTransaction(req1 as Request, res1 as Response);
      expect(res1.status).toHaveBeenCalledWith(400);

      const req2 = createMockRequest({ body: { data: { studyId: 1 } } });
      const res2 = createMockResponse();
      await verifyTransaction(req2 as Request, res2 as Response);
      expect(res2.status).toHaveBeenCalledWith(400);
    });

    it("should handle unexpected error during verification", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected database error");
        }),
      };
      const req = createMockRequest({
        body: { data: { studyId: 1, transactionHash: "0xabc123" } },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await verifyTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

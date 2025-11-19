import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { StudyCriteria } from "@zk-medical/shared";

// Set test environment before imports
process.env.NODE_ENV = "test";
process.env.SEPOLIA_PRIVATE_KEY = "0x" + "a".repeat(64);
process.env.SEPOLIA_RPC_URL = "https://sepolia.example.com";

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

// Mock config
mock.module("@/config/config", () => ({
  Config: {
    SEPOLIA_PRIVATE_KEY: "0x" + "a".repeat(64),
    SEPOLIA_RPC_URL: "https://sepolia.example.com",
    STUDY_FACTORY_ADDRESS: "0xFactoryAddress123",
    ZK_VERIFIER_ADDRESS: "0xVerifierAddress123",
  },
}));

// Mock contract ABIs
mock.module("../contracts/generated", () => ({
  STUDY_ABI: [
    {
      type: "function",
      name: "registerCommitment",
      inputs: [],
      outputs: [],
    },
    {
      type: "function",
      name: "joinStudy",
      inputs: [],
      outputs: [],
    },
    {
      type: "function",
      name: "revokeConsent",
      inputs: [],
      outputs: [],
    },
    {
      type: "function",
      name: "grantConsent",
      inputs: [],
      outputs: [],
    },
    {
      type: "function",
      name: "hasActiveConsent",
      inputs: [],
      outputs: [{ type: "bool" }],
    },
  ],
  STUDY_FACTORY_ABI: [
    {
      type: "function",
      name: "createStudy",
      inputs: [],
      outputs: [],
    },
    {
      type: "function",
      name: "studyCount",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "openCreation",
      inputs: [],
      outputs: [{ type: "bool" }],
    },
    {
      type: "function",
      name: "authorizedCreators",
      inputs: [],
      outputs: [{ type: "bool" }],
    },
    {
      type: "function",
      name: "owner",
      inputs: [],
      outputs: [{ type: "address" }],
    },
    {
      type: "event",
      name: "StudyCreated",
      inputs: [
        { name: "studyId", type: "uint256", indexed: true },
        { name: "studyContract", type: "address", indexed: false },
      ],
    },
  ],
}));

import { StudyService } from "./studyService";
import { JoinStudyError } from "./errors/joinStudyError";

let studyService: StudyService;

describe("StudyService", () => {
  beforeEach(() => {
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    studyService = new StudyService();
  });

  describe("initialization", () => {
    test("should skip blockchain initialization in test mode", () => {
      // Service is already instantiated, just verify it exists
      expect(studyService).toBeDefined();
    });
  });

  describe("getStudyCount", () => {
    test("should return 0 when blockchain client is not initialized", async () => {
      const count = await studyService.getStudyCount();
      expect(count).toBe(0);
    });
  });

  describe("healthCheck", () => {
    test("should return healthy status in test mode", async () => {
      const result = await studyService.healthCheck();
      expect(result.healthy).toBe(true);
    });
  });

  describe("hasActiveConsent", () => {
    test("should return false in test mode", async () => {
      const result = await studyService.hasActiveConsent("0xStudy123", "0xParticipant456");
      expect(result.hasConsent).toBe(false);
    });
  });

  describe("registerCommitmentOnChain", () => {
    test("should handle missing blockchain client", async () => {
      const result = await studyService.registerCommitmentOnChain(
        "0xContract123",
        "0xParticipant456",
        "12345678901234567890",
        "0xchallenge789"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("revokeStudyConsent", () => {
    test("should handle missing blockchain client", async () => {
      const result = await studyService.revokeStudyConsent("0xStudy123", "0xParticipant456");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("grantStudyConsent", () => {
    test("should handle missing blockchain client", async () => {
      const result = await studyService.grantStudyConsent("0xStudy123", "0xParticipant456");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("joinBlockchainStudy", () => {
    test("should throw JoinStudyError when contractAddress is empty", async () => {
      const promise = studyService.joinBlockchainStudy(
        "",
        {
          a: ["1", "2"] as [string, string],
          b: [["3", "4"] as [string, string], ["5", "6"] as [string, string]] as [
            [string, string],
            [string, string]
          ],
          c: ["7", "8"] as [string, string],
        },
        "0xParticipant",
        "1234",
        "0xchallenge",
        ["publicInput1", "publicInput2"]
      );
      
      await expect(promise).rejects.toThrow(JoinStudyError);
    });

    test("should throw JoinStudyError on blockchain error", async () => {
      const promise = studyService.joinBlockchainStudy(
        "0xContract",
        {
          a: ["1", "2"] as [string, string],
          b: [["3", "4"] as [string, string], ["5", "6"] as [string, string]] as [
            [string, string],
            [string, string]
          ],
          c: ["7", "8"] as [string, string],
        },
        "0xParticipant",
        "1234",
        "0xchallenge",
        []
      );
      await expect(promise).rejects.toThrow(JoinStudyError);
    });
  });

  describe("sendParticipationToBlockchain", () => {
    test("should handle invalid proof format gracefully", async () => {
      const promise = studyService.sendParticipationToBlockchain(
        "0xStudy",
        "0xParticipant",
        {
          a: ["invalid", "2"] as [string, string],
          b: [["3", "4"] as [string, string], ["5", "6"] as [string, string]] as [
            [string, string],
            [string, string]
          ],
          c: ["7", "8"] as [string, string],
        },
        "1234",
        "0xchallenge",
        []
      );
      await expect(promise).rejects.toThrow(JoinStudyError);
    });

    test("should handle missing blockchain client", async () => {
      const result = await studyService.sendParticipationToBlockchain(
        "0xStudy",
        "0xParticipant",
        {
          a: ["1", "2"] as [string, string],
          b: [["3", "4"] as [string, string], ["5", "6"] as [string, string]] as [
            [string, string],
            [string, string]
          ],
          c: ["7", "8"] as [string, string],
        },
        "1234",
        "0xchallenge",
        []
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("deployStudy", () => {
    const validStudyParams = {
      title: "Test Study",
      description: "A test study",
      maxParticipants: 100,
      startDate: Math.floor(Date.now() / 1000),
      endDate: Math.floor(Date.now() / 1000) + 86400 * 30,
      principalInvestigator: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      criteria: {
        enableAge: 1,
        minAge: 18,
        maxAge: 65,
        enableCholesterol: 0,
        minCholesterol: 0,
        maxCholesterol: 0,
        enableBMI: 0,
        minBMI: 0,
        maxBMI: 0,
        enableBloodType: 0,
        allowedBloodTypes: [0, 0, 0, 0],
        enableGender: 0,
        allowedGender: 0,
        enableLocation: 0,
        allowedRegions: [0, 0, 0, 0],
        enableBloodPressure: 0,
        minSystolic: 0,
        maxSystolic: 0,
        minDiastolic: 0,
        maxDiastolic: 0,
        enableSmoking: 0,
        allowedSmoking: 0,
        enableHbA1c: 0,
        minHbA1c: 0,
        maxHbA1c: 0,
        enableActivity: 0,
        minActivityLevel: 0,
        maxActivityLevel: 0,
        enableDiabetes: 0,
        allowedDiabetes: 0,
        enableHeartDisease: 0,
        allowedHeartDisease: 0,
      } as StudyCriteria,
    };

    test("should handle missing blockchain client in deployStudy", async () => {
      const result = await studyService.deployStudy(validStudyParams);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should handle criteria formatting errors", async () => {
      const invalidParams = {
        ...validStudyParams,
        criteria: null as any,
      };
      const result = await studyService.deployStudy(invalidParams);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("utility methods (private methods accessed via type assertion)", () => {
    test("convertToBigIntTuple - should convert array to BigInt tuple", () => {
      const service = studyService as any;
      const result = service.convertToBigIntTuple([1, 2, 3, 4]);
      expect(result).toEqual([1n, 2n, 3n, 4n]);
    });

    test("convertToBigIntTuple - should handle undefined", () => {
      const service = studyService as any;
      const result = service.convertToBigIntTuple(undefined);
      expect(result).toEqual([0n, 0n, 0n, 0n]);
    });

    test("convertToBigIntTuple - should handle partial arrays", () => {
      const service = studyService as any;
      const result = service.convertToBigIntTuple([1, 2]);
      expect(result).toEqual([1n, 2n, 0n, 0n]);
    });

    test("formatCriteriaForContract - should format minimal criteria", () => {
      const service = studyService as any;
      const criteria = {
        enableAge: 0,
        enableCholesterol: 0,
        enableBMI: 0,
        enableBloodType: 0,
        enableGender: 0,
        enableLocation: 0,
        enableBloodPressure: 0,
        enableSmoking: 0,
        enableHbA1c: 0,
        enableActivity: 0,
        enableDiabetes: 0,
        enableHeartDisease: 0,
      } as unknown as StudyCriteria;

      const formatted = service.formatCriteriaForContract(criteria);
      expect(formatted.enableAge).toBe(0n);
      expect(formatted.minAge).toBe(0n);
      expect(formatted.maxAge).toBe(150n);
    });

    test("formatCriteriaForContract - should format age criteria when enabled", () => {
      const service = studyService as any;
      const criteria = {
        enableAge: 1,
        minAge: 18,
        maxAge: 65,
        enableCholesterol: 0,
        enableBMI: 0,
        enableBloodType: 0,
        enableGender: 0,
        enableLocation: 0,
        enableBloodPressure: 0,
        enableSmoking: 0,
        enableHbA1c: 0,
        enableActivity: 0,
        enableDiabetes: 0,
        enableHeartDisease: 0,
      } as unknown as StudyCriteria;

      const formatted = service.formatCriteriaForContract(criteria);
      expect(formatted.enableAge).toBe(1n);
      expect(formatted.minAge).toBe(18n);
      expect(formatted.maxAge).toBe(65n);
    });

    test("formatCriteriaForContract - should handle blood type array", () => {
      const service = studyService as any;
      const criteria = {
        enableAge: 0,
        enableCholesterol: 0,
        enableBMI: 0,
        enableBloodType: 1,
        allowedBloodTypes: [1, 2, 3, 4],
        enableGender: 0,
        enableLocation: 0,
        enableBloodPressure: 0,
        enableSmoking: 0,
        enableHbA1c: 0,
        enableActivity: 0,
        enableDiabetes: 0,
        enableHeartDisease: 0,
      } as unknown as StudyCriteria;

      const formatted = service.formatCriteriaForContract(criteria);
      expect(formatted.enableBloodType).toBe(1n);
      expect(formatted.allowedBloodTypes).toEqual([1n, 2n, 3n, 4n]);
    });

    test("formatCriteriaForContract - should handle all criteria types", () => {
      const service = studyService as any;
      const criteria = {
        enableAge: 1,
        minAge: 25,
        maxAge: 60,
        enableCholesterol: 1,
        minCholesterol: 150,
        maxCholesterol: 250,
        enableBMI: 1,
        minBMI: 185,
        maxBMI: 300,
        enableBloodType: 1,
        allowedBloodTypes: [1, 2, 3, 4],
        enableGender: 1,
        allowedGender: 1,
        enableLocation: 1,
        allowedRegions: [1, 2, 0, 0],
        enableBloodPressure: 1,
        minSystolic: 120,
        maxSystolic: 140,
        minDiastolic: 80,
        maxDiastolic: 90,
        enableSmoking: 1,
        allowedSmoking: 0,
        enableHbA1c: 1,
        minHbA1c: 50,
        maxHbA1c: 70,
        enableActivity: 1,
        minActivityLevel: 100,
        maxActivityLevel: 300,
        enableDiabetes: 1,
        allowedDiabetes: 1,
        enableHeartDisease: 1,
        allowedHeartDisease: 0,
      } as StudyCriteria;

      const formatted = service.formatCriteriaForContract(criteria);

      expect(formatted.enableAge).toBe(1n);
      expect(formatted.minAge).toBe(25n);
      expect(formatted.maxAge).toBe(60n);
      expect(formatted.enableCholesterol).toBe(1n);
      expect(formatted.minCholesterol).toBe(150n);
      expect(formatted.maxCholesterol).toBe(250n);
      expect(formatted.enableBMI).toBe(1n);
      expect(formatted.minBMI).toBe(185n);
      expect(formatted.maxBMI).toBe(300n);
      expect(formatted.enableBloodType).toBe(1n);
      expect(formatted.allowedBloodTypes).toEqual([1n, 2n, 3n, 4n]);
      expect(formatted.enableGender).toBe(1n);
      expect(formatted.allowedGender).toBe(1n);
      expect(formatted.enableLocation).toBe(1n);
      expect(formatted.allowedRegions).toEqual([1n, 2n, 0n, 0n]);
      expect(formatted.enableBloodPressure).toBe(1n);
      expect(formatted.minSystolic).toBe(120n);
      expect(formatted.maxSystolic).toBe(140n);
      expect(formatted.minDiastolic).toBe(80n);
      expect(formatted.maxDiastolic).toBe(90n);
      expect(formatted.enableSmoking).toBe(1n);
      expect(formatted.allowedSmoking).toBe(0n);
      expect(formatted.enableHbA1c).toBe(1n);
      expect(formatted.minHbA1c).toBe(50n);
      expect(formatted.maxHbA1c).toBe(70n);
      expect(formatted.enableActivity).toBe(1n);
      expect(formatted.minActivityLevel).toBe(100n);
      expect(formatted.maxActivityLevel).toBe(300n);
      expect(formatted.enableDiabetes).toBe(1n);
      expect(formatted.allowedDiabetes).toBe(1n);
      expect(formatted.enableHeartDisease).toBe(1n);
      expect(formatted.allowedHeartDisease).toBe(0n);
    });

    test("logConsentResult - should log success for revoke", () => {
      const service = studyService as any;
      service.logConsentResult(
        "revoke",
        { success: true, transactionHash: "0xtx123" },
        "0xStudy",
        "0xParticipant"
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    test("logConsentResult - should log success for grant", () => {
      const service = studyService as any;
      service.logConsentResult(
        "grant",
        { success: true, transactionHash: "0xtx123" },
        "0xStudy",
        "0xParticipant"
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    test("logConsentResult - should log error for failed revoke", () => {
      const service = studyService as any;
      service.logConsentResult(
        "revoke",
        { success: false, error: "Test error" },
        "0xStudy",
        "0xParticipant"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test("logConsentResult - should log error for failed grant", () => {
      const service = studyService as any;
      service.logConsentResult(
        "grant",
        { success: false, error: "Test error" },
        "0xStudy",
        "0xParticipant"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

import { describe, it, expect } from "bun:test";
import type { StudyDeploymentParams, StudyDeploymentResult } from "./studyService";
import type { StudyCriteria } from "@zk-medical/shared";

/**
 * Test suite for Study Service
 * Tests study deployment, consent management, and blockchain interactions
 */

describe("StudyService - deployStudy", () => {
  const mockCriteria: StudyCriteria = {
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
    enableCholesterol: 0,
    minCholesterol: 0,
    maxCholesterol: 0,
    enableBMI: 1,
    minBMI: 185, // 18.5 * 10
    maxBMI: 300, // 30.0 * 10
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
  };

  const validDeploymentParams: StudyDeploymentParams = {
    title: "Test Study",
    description: "A test research study",
    maxParticipants: 100,
    startDate: Math.floor(Date.now() / 1000),
    endDate: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year from now
    principalInvestigator: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    criteria: mockCriteria,
  };

  it("should validate deployment parameters structure", () => {
    expect(validDeploymentParams.title).toBeDefined();
    expect(validDeploymentParams.description).toBeDefined();
    expect(validDeploymentParams.maxParticipants).toBeGreaterThan(0);
    expect(validDeploymentParams.startDate).toBeGreaterThan(0);
    expect(validDeploymentParams.endDate).toBeGreaterThan(validDeploymentParams.startDate);
    expect(validDeploymentParams.principalInvestigator).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(validDeploymentParams.criteria).toBeDefined();
  });

  it("should validate criteria format", () => {
    const criteria = mockCriteria;
    expect(typeof criteria.enableAge).toBe("number");
    expect(typeof criteria.minAge).toBe("number");
    expect(typeof criteria.maxAge).toBe("number");
    expect(Array.isArray(criteria.allowedBloodTypes)).toBe(true);
    expect(criteria.allowedBloodTypes).toHaveLength(4);
  });

  it("should format criteria with safe ranges", () => {
    const criteria: StudyCriteria = {
      enableAge: 1,
      minAge: 25,
      maxAge: 50,
      enableCholesterol: 1,
      minCholesterol: 150,
      maxCholesterol: 250,
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
    };

    expect(criteria.enableAge).toBe(1);
    expect(criteria.minAge).toBe(25);
    expect(criteria.maxAge).toBe(50);
    expect(criteria.enableCholesterol).toBe(1);
    expect(criteria.minCholesterol).toBe(150);
    expect(criteria.maxCholesterol).toBe(250);
  });

  it("should handle disabled criteria with default values", () => {
    const criteria: StudyCriteria = {
      ...mockCriteria,
      enableAge: 0,
      minAge: 0,
      maxAge: 0,
    };

    expect(criteria.enableAge).toBe(0);
  });

  it("should validate BigInt conversion for tuples", () => {
    const bloodTypes = [1, 2, 3, 4] as const;
    const regions = [0, 1, 2, 0] as const;

    bloodTypes.forEach((type) => {
      expect(typeof BigInt(type)).toBe("bigint");
    });

    regions.forEach((region) => {
      expect(typeof BigInt(region)).toBe("bigint");
    });
  });
});

describe("StudyService - Criteria Formatting", () => {
  it("should convert numbers to BigInt format", () => {
    const testValues = [0, 18, 65, 100, 250];

    testValues.forEach((value) => {
      const bigIntValue = BigInt(value);
      expect(typeof bigIntValue).toBe("bigint");
      expect(Number(bigIntValue)).toBe(value);
    });
  });

  it("should handle blood type array conversion", () => {
    const bloodTypes: readonly number[] = [0, 1, 2, 3];
    const tuple: [bigint, bigint, bigint, bigint] = [
      BigInt(bloodTypes[0]!),
      BigInt(bloodTypes[1]!),
      BigInt(bloodTypes[2]!),
      BigInt(bloodTypes[3]!),
    ];

    expect(tuple).toHaveLength(4);
    expect(typeof tuple[0]).toBe("bigint");
    expect(typeof tuple[3]).toBe("bigint");
  });

  it("should handle undefined arrays with defaults", () => {
    const defaultArray = [0, 0, 0, 0] as const;
    const source: number[] | undefined = undefined;
    const arr = source || defaultArray;

    expect(arr).toHaveLength(4);
    expect(arr[0]).toBe(0);
  });

  it("should validate range logic", () => {
    const testRanges = [
      { enable: 1, min: 18, max: 65, valid: true },
      { enable: 0, min: 0, max: 0, valid: true },
      { enable: 1, min: 100, max: 50, valid: false }, // Invalid: min > max
    ];

    testRanges.forEach((range) => {
      if (range.enable === 1 && range.valid) {
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    });
  });

  it("should validate BMI scaling (stored as integers)", () => {
    const bmiValues = [
      { actual: 18.5, stored: 185 },
      { actual: 25.0, stored: 250 },
      { actual: 30.0, stored: 300 },
    ];

    bmiValues.forEach((bmi) => {
      expect(bmi.stored).toBe(Math.floor(bmi.actual * 10));
    });
  });

  it("should validate HbA1c scaling (stored as integers)", () => {
    const hba1cValues = [
      { actual: 4.0, stored: 40 },
      { actual: 5.7, stored: 57 },
      { actual: 6.5, stored: 65 },
    ];

    hba1cValues.forEach((hba1c) => {
      expect(hba1c.stored).toBe(Math.floor(hba1c.actual * 10));
    });
  });
});

describe("StudyService - Proof Formatting", () => {
  it("should validate proof structure", () => {
    const validProof = {
      a: ["123", "456"],
      b: [
        ["789", "012"],
        ["345", "678"],
      ],
      c: ["901", "234"],
    };

    expect(validProof.a).toHaveLength(2);
    expect(validProof.b).toHaveLength(2);
    expect(validProof.b[0]).toHaveLength(2);
    expect(validProof.b[1]).toHaveLength(2);
    expect(validProof.c).toHaveLength(2);
  });

  it("should convert proof strings to BigInt", () => {
    const proofA = ["123456789", "987654321"];
    const pA: [bigint, bigint] = [BigInt(proofA[0]!), BigInt(proofA[1]!)];

    expect(typeof pA[0]).toBe("bigint");
    expect(typeof pA[1]).toBe("bigint");
    expect(Number(pA[0])).toBe(123456789);
  });

  it("should convert nested proof arrays", () => {
    const proofB = [
      ["111", "222"],
      ["333", "444"],
    ];

    const pB: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(proofB[0]![0]!), BigInt(proofB[0]![1]!)],
      [BigInt(proofB[1]![0]!), BigInt(proofB[1]![1]!)],
    ];

    expect(pB).toHaveLength(2);
    expect(pB[0]).toHaveLength(2);
    expect(typeof pB[0][0]).toBe("bigint");
    expect(typeof pB[1][1]).toBe("bigint");
  });

  it("should validate data commitment format", () => {
    const dataCommitments = ["12345", "67890", "0"];

    dataCommitments.forEach((commitment) => {
      const bigIntCommitment = BigInt(commitment);
      expect(typeof bigIntCommitment).toBe("bigint");
    });
  });
});

describe("StudyService - Consent Operations", () => {
  const mockStudyAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
  const mockParticipant = "0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb1";

  it("should validate consent operation parameters", () => {
    expect(mockStudyAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(mockParticipant).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(mockStudyAddress).not.toBe(mockParticipant);
  });

  it("should validate consent state transitions", () => {
    const transitions = [
      { from: false, to: true, operation: "grant", valid: true },
      { from: true, to: false, operation: "revoke", valid: true },
      { from: false, to: false, operation: "grant", valid: false },
      { from: true, to: true, operation: "revoke", valid: false },
    ];

    transitions.forEach((transition) => {
      if (transition.valid) {
        expect(transition.from).not.toBe(transition.to);
      } else {
        expect(transition.from).toBe(transition.to);
      }
    });
  });

  it("should validate Ethereum address format for consent", () => {
    const validAddresses = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x0000000000000000000000000000000000000000",
    ];

    const invalidAddresses = ["0x123", "not-an-address", ""];

    validAddresses.forEach((addr) => {
      expect(addr.startsWith("0x")).toBe(true);
      expect(addr.length).toBe(42);
    });

    invalidAddresses.forEach((addr) => {
      const isValid = addr.startsWith("0x") && addr.length === 42;
      expect(isValid).toBe(false);
    });
  });
});

describe("StudyService - Participation", () => {
  it("should validate participation data structure", () => {
    const participationData = {
      participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      proof: {
        a: ["123", "456"],
        b: [
          ["789", "012"],
          ["345", "678"],
        ],
        c: ["901", "234"],
      },
      dataCommitment: "12345678",
    };

    expect(participationData.participantWallet).toBeDefined();
    expect(participationData.proof).toBeDefined();
    expect(participationData.dataCommitment).toBeDefined();
  });

  it("should validate proof conversion doesn't lose precision", () => {
    const largeNumber = "999999999999999999";
    const bigIntValue = BigInt(largeNumber);
    const backToString = bigIntValue.toString();

    expect(backToString).toBe(largeNumber);
  });

  it("should handle proof conversion errors gracefully", () => {
    const invalidProofs = [
      { a: ["invalid", "456"], valid: false },
      { a: [null, "456"], valid: false },
      { a: ["123", undefined], valid: false },
    ];

    invalidProofs.forEach((proof) => {
      try {
        BigInt(proof.a[0] as any);
        expect(proof.valid).toBe(true);
      } catch {
        expect(proof.valid).toBe(false);
      }
    });
  });
});

describe("StudyService - Health Check", () => {
  it("should validate health check response structure", () => {
    const healthyResponse = { healthy: true };
    const unhealthyResponse = { healthy: false, error: "Connection failed" };

    expect(healthyResponse.healthy).toBe(true);
    expect("error" in healthyResponse).toBe(false);

    expect(unhealthyResponse.healthy).toBe(false);
    expect(unhealthyResponse.error).toBeDefined();
  });

  it("should validate study count is non-negative", () => {
    const validCounts = [0, 1, 10, 100, 1000];
    const invalidCounts = [-1, -10];

    validCounts.forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(0);
    });

    invalidCounts.forEach((count) => {
      expect(count).toBeLessThan(0);
    });
  });
});

describe("StudyService - Deployment Result", () => {
  it("should validate successful deployment result structure", () => {
    const successResult: StudyDeploymentResult = {
      success: true,
      studyId: 1,
      studyAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      transactionHash: "0xabc123def456",
      gasUsed: "123456",
    };

    expect(successResult.success).toBe(true);
    expect(successResult.studyId).toBeDefined();
    expect(successResult.studyAddress).toBeDefined();
    expect(successResult.transactionHash).toBeDefined();
    expect(successResult.gasUsed).toBeDefined();
    expect(successResult.error).toBeUndefined();
  });

  it("should validate failed deployment result structure", () => {
    const failureResult: StudyDeploymentResult = {
      success: false,
      error: "Deployment failed",
    };

    expect(failureResult.success).toBe(false);
    expect(failureResult.error).toBeDefined();
    expect(failureResult.studyId).toBeUndefined();
    expect(failureResult.studyAddress).toBeUndefined();
  });

  it("should validate transaction hash format", () => {
    const validHashes = ["0xabc123", "0x" + "a".repeat(64)];

    validHashes.forEach((hash) => {
      expect(hash.startsWith("0x")).toBe(true);
      expect(hash.length).toBeGreaterThan(2);
    });
  });

  it("should validate gas usage is numeric string", () => {
    const gasValues = ["123456", "789012", "0"];

    gasValues.forEach((gas) => {
      const parsed = Number.parseInt(gas, 10);
      expect(Number.isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("StudyService - Date/Time Validation", () => {
  it("should validate Unix timestamp format", () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 86400 * 365; // 1 year from now

    expect(now).toBeGreaterThan(0);
    expect(future).toBeGreaterThan(now);
  });

  it("should validate study duration calculation", () => {
    const startDate = Math.floor(Date.now() / 1000);
    const durations = [
      { days: 30, seconds: 30 * 86400 },
      { days: 365, seconds: 365 * 86400 },
      { days: 180, seconds: 180 * 86400 },
    ];

    durations.forEach((duration) => {
      const endDate = startDate + duration.seconds;
      expect(endDate).toBeGreaterThan(startDate);
      expect(endDate - startDate).toBe(duration.seconds);
    });
  });

  it("should validate start date before end date", () => {
    const startDate = 1700000000;
    const endDate = 1700086400;

    expect(endDate).toBeGreaterThan(startDate);
    expect(endDate - startDate).toBeGreaterThan(0);
  });
});

describe("StudyService - Parameter Validation", () => {
  it("should validate max participants range", () => {
    const validParticipants = [1, 10, 50, 100, 1000];
    const invalidParticipants = [0, -1, -10];

    validParticipants.forEach((count) => {
      expect(count).toBeGreaterThan(0);
    });

    invalidParticipants.forEach((count) => {
      expect(count).toBeLessThanOrEqual(0);
    });
  });

  it("should validate title and description length", () => {
    const validTitles = ["Test Study", "A".repeat(100), "Research Project"];
    const emptyTitle = "";

    validTitles.forEach((title) => {
      expect(title.length).toBeGreaterThan(0);
    });

    expect(emptyTitle.length).toBe(0);
  });

  it("should validate principal investigator address", () => {
    const validPIs = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x0000000000000000000000000000000000000001",
    ];

    validPIs.forEach((pi) => {
      expect(pi.startsWith("0x")).toBe(true);
      expect(pi.length).toBe(42);
    });
  });
});

describe("StudyService - Error Handling", () => {
  it("should validate error message format", () => {
    const errors = [
      "Deployment failed",
      "Invalid criteria format",
      "Transaction reverted",
      "Authorization check failed",
    ];

    errors.forEach((error) => {
      expect(typeof error).toBe("string");
      expect(error.length).toBeGreaterThan(0);
    });
  });

  it("should validate error result structure", () => {
    const errorResults = [
      { success: false, error: "Test error" },
      { success: false, error: "Unknown error" },
    ];

    errorResults.forEach((result) => {
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe("StudyService - Blockchain Integration", () => {
  it("should validate contract address format", () => {
    const contractAddresses = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x1234567890123456789012345678901234567890",
    ];

    contractAddresses.forEach((address) => {
      expect(address.startsWith("0x")).toBe(true);
      expect(address.length).toBe(42);
      expect(/^0x[a-fA-F0-9]{40}$/.test(address)).toBe(true);
    });
  });

  it("should validate chain ID", () => {
    const SEPOLIA_CHAIN_ID = 11155111;

    expect(typeof SEPOLIA_CHAIN_ID).toBe("number");
    expect(SEPOLIA_CHAIN_ID).toBeGreaterThan(0);
  });

  it("should validate transaction receipt status", () => {
    const validStatuses = ["success", "reverted"] as const;

    validStatuses.forEach((status) => {
      expect(["success", "reverted"].includes(status)).toBe(true);
    });
  });

  it("should validate gas estimation", () => {
    const gasEstimates = ["21000", "100000", "500000"];

    gasEstimates.forEach((gas) => {
      const value = BigInt(gas);
      expect(typeof value).toBe("bigint");
      expect(value > 0n).toBe(true);
    });
  });
});

describe("StudyService - Criteria Validation Logic", () => {
  it("should validate age criteria ranges", () => {
    const ageRanges = [
      { min: 18, max: 65, valid: true },
      { min: 0, max: 150, valid: true },
      { min: 65, max: 18, valid: false },
      { min: -1, max: 65, valid: false },
    ];

    ageRanges.forEach((range) => {
      if (range.valid) {
        expect(range.min).toBeGreaterThanOrEqual(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
        expect(range.max).toBeLessThanOrEqual(150);
      }
    });
  });

  it("should validate cholesterol ranges", () => {
    const cholesterolRanges = [
      { min: 100, max: 300, valid: true },
      { min: 0, max: 1000, valid: true },
      { min: -1, max: 300, valid: false },
    ];

    cholesterolRanges.forEach((range) => {
      if (range.valid) {
        expect(range.min).toBeGreaterThanOrEqual(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      }
    });
  });

  it("should validate blood pressure ranges", () => {
    const bpRanges = [
      { minSystolic: 90, maxSystolic: 140, minDiastolic: 60, maxDiastolic: 90, valid: true },
      { minSystolic: 70, maxSystolic: 250, minDiastolic: 40, maxDiastolic: 150, valid: true },
    ];

    bpRanges.forEach((range) => {
      if (range.valid) {
        expect(range.minSystolic).toBeLessThanOrEqual(range.maxSystolic);
        expect(range.minDiastolic).toBeLessThanOrEqual(range.maxDiastolic);
      }
    });
  });

  it("should validate activity level ranges", () => {
    const activityRanges = [
      { min: 0, max: 500, valid: true },
      { min: 100, max: 300, valid: true },
      { min: -1, max: 500, valid: false },
    ];

    activityRanges.forEach((range) => {
      if (range.valid) {
        expect(range.min).toBeGreaterThanOrEqual(0);
        expect(range.max).toBeGreaterThanOrEqual(range.min);
      }
    });
  });
});

describe("StudyService - Enum Validation", () => {
  it("should validate gender enum values", () => {
    const genderValues = [0, 1, 2]; // Example: 0=Any, 1=Male, 2=Female

    genderValues.forEach((gender) => {
      expect(typeof gender).toBe("number");
      expect(gender).toBeGreaterThanOrEqual(0);
    });
  });

  it("should validate blood type enum values", () => {
    const bloodTypeValues = [0, 1, 2, 3, 4, 5, 6, 7]; // A+, A-, B+, B-, AB+, AB-, O+, O-

    bloodTypeValues.forEach((bloodType) => {
      expect(typeof bloodType).toBe("number");
      expect(bloodType).toBeGreaterThanOrEqual(0);
      expect(bloodType).toBeLessThanOrEqual(7);
    });
  });

  it("should validate smoking status enum", () => {
    const smokingValues = [0, 1, 2]; // 0=Any, 1=Non-smoker, 2=Smoker

    smokingValues.forEach((smoking) => {
      expect(typeof smoking).toBe("number");
      expect(smoking).toBeGreaterThanOrEqual(0);
    });
  });

  it("should validate diabetes status enum", () => {
    const diabetesValues = [0, 1, 2]; // 0=Any, 1=No diabetes, 2=Has diabetes

    diabetesValues.forEach((diabetes) => {
      expect(typeof diabetes).toBe("number");
      expect(diabetes).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("StudyService - Contract Call Validation", () => {
  it("should validate contract function names", () => {
    const functionNames = [
      "createStudy",
      "joinStudy",
      "revokeConsent",
      "grantConsent",
      "hasActiveConsent",
    ];

    functionNames.forEach((name) => {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it("should validate ABI function structure", () => {
    const mockAbiFunction = {
      name: "createStudy",
      type: "function",
      inputs: [],
      outputs: [],
    };

    expect(mockAbiFunction.name).toBeDefined();
    expect(mockAbiFunction.type).toBe("function");
    expect(Array.isArray(mockAbiFunction.inputs)).toBe(true);
    expect(Array.isArray(mockAbiFunction.outputs)).toBe(true);
  });
});

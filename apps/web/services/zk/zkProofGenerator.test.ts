import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { generateZKProof, checkEligibility } from "./zkProofGenerator";
import { ExtractedMedicalData } from "../fhir/types/extractedMedicalData";
import { StudyCriteria, DEFAULT_CRITERIA } from "@zk-medical/shared";

// Mock snarkjs
const mockSnarkjsFullProve = mock(() =>
  Promise.resolve({
    proof: {
      pi_a: ["123", "456"],
      pi_b: [
        ["789", "012"],
        ["345", "678"],
      ],
      pi_c: ["901", "234"],
    },
    publicSignals: ["1", "42"],
  })
);

mock.module("snarkjs", () => ({
  groth16: {
    fullProve: mockSnarkjsFullProve,
  },
}));

// Mock fetch for circuit files
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
  })
);

// @ts-ignore - Mocking global fetch
global.fetch = mockFetch;

// Mock console methods to reduce noise
const originalConsole = { ...console };
beforeEach(() => {
  console.log = mock(() => {});
  console.error = mock(() => {});
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe("generateZKProof", () => {
  let mockMedicalData: ExtractedMedicalData;
  let mockStudyCriteria: StudyCriteria;
  let mockDataCommitment: bigint;
  let mockSalt: number;
  let mockChallenge: string;

  beforeEach(() => {
    mockMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };
    mockStudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
    };
    mockDataCommitment = BigInt(123456789);
    mockSalt = 42;
    mockChallenge = "abcdef1234567890"; // Valid hex string
  });

  it("should generate a ZK proof for eligible patient", async () => {
    const result = await generateZKProof(
      mockMedicalData,
      mockStudyCriteria,
      mockDataCommitment,
      mockSalt,
      mockChallenge
    );

    expect(result).toHaveProperty("proof");
    expect(result).toHaveProperty("publicSignals");
    expect(result.isEligible).toBe(true);
    expect(result.proof).toEqual({
      a: ["123", "456"],
      b: [
        ["012", "789"],
        ["678", "345"],
      ], // Note: b coordinates are swapped in the implementation
      c: ["901", "234"],
    });
    expect(result.publicSignals).toEqual(["1", "42"]);
  });

  it("should return ineligible result when patient doesn't meet criteria", async () => {
    const ineligibleCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 50, // Patient is 45, so ineligible
      maxAge: 65,
    };

    const result = await generateZKProof(
      mockMedicalData,
      ineligibleCriteria,
      mockDataCommitment,
      mockSalt,
      mockChallenge
    );

    expect(result.isEligible).toBe(false);
    expect(result.proof).toEqual({
      a: ["0", "0"],
      b: [
        ["0", "0"],
        ["0", "0"],
      ],
      c: ["0", "0"],
    });
    expect(result.publicSignals).toEqual(["0"]);
  });

  it("should throw error when dataCommitment is undefined", async () => {
    expect(
      generateZKProof(mockMedicalData, mockStudyCriteria, undefined as any, mockSalt, mockChallenge)
    ).rejects.toThrow("dataCommitment is required but was undefined");
  });

  it("should throw error when salt is undefined", async () => {
    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        undefined as any,
        mockChallenge
      )
    ).rejects.toThrow("salt is required but was undefined");
  });

  it("should throw error when salt is null", async () => {
    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        null as any,
        mockChallenge
      )
    ).rejects.toThrow("salt is required but was undefined");
  });

  it("should handle snarkjs errors gracefully", async () => {
    mockSnarkjsFullProve.mockRejectedValueOnce(new Error("Circuit verification failed"));

    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        mockSalt,
        mockChallenge
      )
    ).rejects.toThrow("ZK proof generation failed: Circuit verification failed");
  });

  it("should handle unknown snarkjs errors", async () => {
    mockSnarkjsFullProve.mockRejectedValueOnce("Unknown error");

    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        mockSalt,
        mockChallenge
      )
    ).rejects.toThrow("ZK proof generation failed: Unknown error");
  });

  it("should handle circuit WASM loading failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        mockSalt,
        mockChallenge
      )
    ).rejects.toThrow("Failed to load circuit WASM file");
  });

  it("should handle proving key loading failure", async () => {
    // First call succeeds (WASM), second fails (proving key)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

    expect(
      generateZKProof(
        mockMedicalData,
        mockStudyCriteria,
        mockDataCommitment,
        mockSalt,
        mockChallenge
      )
    ).rejects.toThrow("Failed to load proving key file");
  });
});

describe("checkEligibility", () => {
  let mockMedicalData: ExtractedMedicalData;

  beforeEach(() => {
    mockMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1, 2],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };
  });

  it("should return true for patient meeting all criteria", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 40,
      maxAge: 50,
      enableGender: 1,
      allowedGender: 1,
      enableBMI: 1,
      minBMI: 200, // 25.5 * 10 = 255, so 200-300 range works
      maxBMI: 300,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(true);
  });

  it("should return false when age is below minimum", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 50, // Patient is 45
      maxAge: 60,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when age is above maximum", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 30,
      maxAge: 40, // Patient is 45
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when gender doesn't match", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableGender: 1,
      allowedGender: 2, // Patient is gender 1
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when location doesn't match allowed regions", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableLocation: 1,
      allowedRegions: [5, 6, 7, 8] as const, // Patient has regions [1, 2]
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return true when location matches allowed regions", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableLocation: 1,
      allowedRegions: [1, 3, 4, 5] as const, // Patient has region 1
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(true);
  });

  it("should return false when cholesterol is out of range", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableCholesterol: 1,
      minCholesterol: 250, // Patient has 200
      maxCholesterol: 300,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when BMI is out of range", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBMI: 1,
      minBMI: 300, // Patient has 255 (25.5 * 10)
      maxBMI: 400,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when blood pressure is out of range", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBloodPressure: 1,
      minSystolic: 130, // Patient has 120
      maxSystolic: 150,
      minDiastolic: 70,
      maxDiastolic: 90,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when missing systolic BP data", () => {
    const dataWithoutBP = { ...mockMedicalData, systolicBP: undefined };

    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBloodPressure: 1,
      minSystolic: 100,
      maxSystolic: 140,
      minDiastolic: 60,
      maxDiastolic: 90,
    };

    const result = checkEligibility(dataWithoutBP, criteria);
    expect(result).toBe(false);
  });

  it("should return false when missing diastolic BP data", () => {
    const dataWithoutBP = { ...mockMedicalData, diastolicBP: undefined };

    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBloodPressure: 1,
      minSystolic: 100,
      maxSystolic: 140,
      minDiastolic: 60,
      maxDiastolic: 90,
    };

    const result = checkEligibility(dataWithoutBP, criteria);
    expect(result).toBe(false);
  });

  it("should return false when blood type not in allowed list", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBloodType: 1,
      allowedBloodTypes: [1, 3, 4, 5] as const, // Patient has blood type 2
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return true when blood type is in allowed list", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableBloodType: 1,
      allowedBloodTypes: [2, 3, 4, 5] as const, // Patient has blood type 2
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(true);
  });

  it("should return false when HbA1c is out of range", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableHbA1c: 1,
      minHbA1c: 70, // Patient has 57 (5.7 * 10)
      maxHbA1c: 100,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when smoking status doesn't match", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableSmoking: 1,
      allowedSmoking: 1, // Patient has smoking status 0
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when activity level is out of range", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableActivity: 1,
      minActivityLevel: 5, // Patient has activity level 3
      maxActivityLevel: 10,
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when diabetes status doesn't match", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableDiabetes: 1,
      allowedDiabetes: 2, // Patient has diabetes status 1
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return false when heart disease status doesn't match", () => {
    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableHeartDisease: 1,
      allowedHeartDisease: 1, // Patient has heart disease status 0
    };

    const result = checkEligibility(mockMedicalData, criteria);
    expect(result).toBe(false);
  });

  it("should return true when no criteria are enabled", () => {
    const result = checkEligibility(mockMedicalData, DEFAULT_CRITERIA);
    expect(result).toBe(true);
  });

  it("should handle missing optional fields gracefully", () => {
    const incompleteData: ExtractedMedicalData = {
      age: 45,
      // Missing many fields
    };

    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 40,
      maxAge: 50,
    };

    const result = checkEligibility(incompleteData, criteria);
    expect(result).toBe(true);
  });

  it("should handle zero values correctly", () => {
    const zeroData: ExtractedMedicalData = {
      age: 0,
      gender: 0,
      bmi: 0,
      cholesterol: 0,
      systolicBP: 0,
      diastolicBP: 0,
      smokingStatus: 0,
      regions: [0],
      bloodType: 0,
      hba1c: 0,
      activityLevel: 0,
      diabetesStatus: 0,
      heartDiseaseStatus: 0,
    };

    const criteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 0,
      maxAge: 10,
      enableBMI: 1,
      minBMI: 0,
      maxBMI: 10,
    };

    const result = checkEligibility(zeroData, criteria);
    expect(result).toBe(true);
  });
});

describe("Circuit file loading (tested via generateZKProof)", () => {
  it("should handle WASM fetch failure in generateZKProof", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const mockMedicalData: ExtractedMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };

    const mockStudyCriteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
    };

    expect(
      generateZKProof(mockMedicalData, mockStudyCriteria, BigInt(123), 42, "abcdef1234567890")
    ).rejects.toThrow("Failed to load circuit WASM file");
  });

  it("should handle proving key fetch failure in generateZKProof", async () => {
    // First call succeeds (WASM), second fails (proving key)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

    const mockMedicalData: ExtractedMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };

    const mockStudyCriteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
    };

    expect(
      generateZKProof(mockMedicalData, mockStudyCriteria, BigInt(123), 42, "abcdef1234567890")
    ).rejects.toThrow("Failed to load proving key file");
  });

  it("should handle network errors during file loading in generateZKProof", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

    const mockMedicalData: ExtractedMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };

    const mockStudyCriteria: StudyCriteria = {
      ...DEFAULT_CRITERIA,
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
    };

    expect(
      generateZKProof(mockMedicalData, mockStudyCriteria, BigInt(123), 42, "abcdef1234567890")
    ).rejects.toThrow("Failed to load circuit WASM file");
  });
});

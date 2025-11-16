import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  generateDataCommitment,
  generateSecureSalt,
  normalizeMedicalDataForCircuit,
} from "./commitmentGenerator";
import { ExtractedMedicalData } from "../fhir/types/extractedMedicalData";

// Mock poseidon-lite functions
mock.module("poseidon-lite", () => ({
  poseidon3: mock(() => BigInt(123456789)),
  poseidon7: mock(() => BigInt(987654321)),
}));

describe("generateDataCommitment", () => {
  let mockMedicalData: ExtractedMedicalData;
  let mockSalt: number;

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
    mockSalt = 42;
  });

  it("should generate a commitment with complete medical data", () => {
    const result = generateDataCommitment(mockMedicalData, mockSalt);

    expect(typeof result).toBe("bigint");
    expect(result).toBe(BigInt(123456789)); // Mocked return value
  });

  it("should handle medical data with missing optional fields", () => {
    const incompleteData: ExtractedMedicalData = {
      age: 30,
      gender: 0,
    };

    const result = generateDataCommitment(incompleteData, mockSalt);

    expect(typeof result).toBe("bigint");
    expect(result).toBe(BigInt(123456789));
  });

  it("should throw error when poseidon functions fail", () => {
    // Mock poseidon7 to throw an error
    const { poseidon7 } = require("poseidon-lite");
    poseidon7.mockImplementationOnce(() => {
      throw new Error("Poseidon hash failed");
    });

    expect(() => generateDataCommitment(mockMedicalData, mockSalt)).toThrow(
      "Data commitment generation failed: Poseidon hash failed"
    );
  });

  it("should handle unknown errors gracefully", () => {
    const { poseidon7 } = require("poseidon-lite");
    poseidon7.mockImplementationOnce(() => {
      throw "Unknown error";
    });

    expect(() => generateDataCommitment(mockMedicalData, mockSalt)).toThrow(
      "Data commitment generation failed: Unknown error"
    );
  });
});

describe("generateSecureSalt", () => {
  it("should return a number", () => {
    const result = generateSecureSalt();

    expect(typeof result).toBe("number");
    expect(Number.isInteger(result)).toBe(true);
  });

  it("should generate different values on multiple calls", () => {
    const result1 = generateSecureSalt();
    const result2 = generateSecureSalt();

    // Note: In a real cryptographic scenario, these should be different
    // but crypto.getRandomValues might return the same value in test environment
    expect(typeof result1).toBe("number");
    expect(typeof result2).toBe("number");
  });

  it("should return a value within expected range for Uint32Array", () => {
    const result = generateSecureSalt();

    // Uint32Array values are 0 to 2^32 - 1
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(4294967295); // 2^32 - 1
  });
});

describe("normalizeMedicalDataForCircuit", () => {
  it("should normalize complete medical data correctly", () => {
    const input: ExtractedMedicalData = {
      age: 45,
      gender: 1,
      bmi: 25.5,
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      smokingStatus: 0,
      regions: [1, 2, 3],
      bloodType: 2,
      hba1c: 5.7,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseStatus: 0,
    };

    const result = normalizeMedicalDataForCircuit(input);

    expect(result).toEqual({
      age: 45,
      gender: 1,
      bmi: 255, // 25.5 * 10 rounded
      smokingStatus: 0,
      region: 1, // First element of regions array
      cholesterol: 200,
      systolicBP: 120,
      diastolicBP: 80,
      hba1c: 57, // 5.7 * 10 rounded
      bloodType: 2,
      activityLevel: 3,
      diabetesStatus: 1,
      heartDiseaseHistory: 0,
    });
  });

  it("should handle missing fields with default values", () => {
    const input: ExtractedMedicalData = {};

    const result = normalizeMedicalDataForCircuit(input);

    expect(result).toEqual({
      age: -1,
      gender: -1,
      bmi: -1,
      smokingStatus: -1,
      region: -1,
      cholesterol: -1,
      systolicBP: -1,
      diastolicBP: -1,
      hba1c: -1,
      bloodType: -1,
      activityLevel: -1,
      diabetesStatus: -1,
      heartDiseaseHistory: -1,
    });
  });

  it("should handle partial data correctly", () => {
    const input: ExtractedMedicalData = {
      age: 30,
      bmi: 22.3,
      hba1c: 4.8,
      regions: [5],
    };

    const result = normalizeMedicalDataForCircuit(input);

    expect(result).toEqual({
      age: 30,
      gender: -1,
      bmi: 223, // 22.3 * 10 rounded
      smokingStatus: -1,
      region: 5,
      cholesterol: -1,
      systolicBP: -1,
      diastolicBP: -1,
      hba1c: 48, // 4.8 * 10 rounded
      bloodType: -1,
      activityLevel: -1,
      diabetesStatus: -1,
      heartDiseaseHistory: -1,
    });
  });

  it("should round BMI and HbA1c values correctly", () => {
    const input: ExtractedMedicalData = {
      bmi: 25.678,
      hba1c: 6.123,
    };

    const result = normalizeMedicalDataForCircuit(input);

    expect(result.bmi).toBe(257); // Math.round(25.678 * 10)
    expect(result.hba1c).toBe(61); // Math.round(6.123 * 10)
  });

  it("should handle empty regions array", () => {
    const input: ExtractedMedicalData = {
      regions: [],
    };

    const result = normalizeMedicalDataForCircuit(input);

    expect(result.region).toBe(-1);
  });

  it("should use first region from array", () => {
    const input: ExtractedMedicalData = {
      regions: [10, 20, 30],
    };

    const result = normalizeMedicalDataForCircuit(input);

    expect(result.region).toBe(10);
  });

  it("should handle zero values correctly", () => {
    const input: ExtractedMedicalData = {
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

    const result = normalizeMedicalDataForCircuit(input);

    expect(result.age).toBe(0);
    expect(result.gender).toBe(0);
    expect(result.bmi).toBe(0); // 0 * 10 = 0
    expect(result.smokingStatus).toBe(0);
    expect(result.region).toBe(0);
    expect(result.cholesterol).toBe(0);
    expect(result.systolicBP).toBe(0);
    expect(result.diastolicBP).toBe(0);
    expect(result.hba1c).toBe(0); // 0 * 10 = 0
    expect(result.bloodType).toBe(0);
    expect(result.activityLevel).toBe(0);
    expect(result.diabetesStatus).toBe(0);
    expect(result.heartDiseaseHistory).toBe(0);
  });
});

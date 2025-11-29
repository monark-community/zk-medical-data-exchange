import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

// Mock poseidon-lite
const mockPoseidon4 = mock((inputs: bigint[]) => BigInt(12345));
const mockPoseidon7 = mock((inputs: bigint[]) => BigInt(67890));

mock.module("poseidon-lite", () => ({
  poseidon4: mockPoseidon4,
  poseidon7: mockPoseidon7,
}));

import {
  generateDataCommitment,
  generateSecureSalt,
  normalizeMedicalDataForCircuit,
} from "./commitmentGenerator";

describe("Commitment Generator", () => {
  beforeEach(() => {
    mockPoseidon4.mockClear();
    mockPoseidon7.mockClear();
  });

  describe("generateSecureSalt", () => {
    it("should generate a random salt", () => {
      const salt = generateSecureSalt();
      expect(typeof salt).toBe("number");
      expect(salt).toBeGreaterThanOrEqual(0);
    });

    it("should generate different salts on multiple calls", () => {
      const salt1 = generateSecureSalt();
      const salt2 = generateSecureSalt();
      const salt3 = generateSecureSalt();

      // Very unlikely to get the same random value three times
      const allSame = salt1 === salt2 && salt2 === salt3;
      expect(allSame).toBe(false);
    });

    it("should generate salt within uint32 range", () => {
      const salt = generateSecureSalt();
      expect(salt).toBeGreaterThanOrEqual(0);
      expect(salt).toBeLessThanOrEqual(4294967295); // Max uint32
    });
  });

  describe("normalizeMedicalDataForCircuit", () => {
    it("should normalize complete medical data", () => {
      const medicalData: ExtractedMedicalData = {
        age: 30,
        gender: 1,
        bmi: 24.5,
        smokingStatus: 0,
        regions: [1, 2],
        cholesterol: 180,
        systolicBP: 120,
        diastolicBP: 80,
        hba1c: 5.5,
        bloodType: 3,
        activityLevel: 2,
        diabetesStatus: 0,
        heartDiseaseStatus: 0,
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.age).toBe(30);
      expect(normalized.gender).toBe(1);
      expect(normalized.bmi).toBe(245); // 24.5 * 10
      expect(normalized.smokingStatus).toBe(0);
      expect(normalized.region).toBe(1); // First region
      expect(normalized.cholesterol).toBe(180);
      expect(normalized.systolicBP).toBe(120);
      expect(normalized.diastolicBP).toBe(80);
      expect(normalized.hba1c).toBe(55); // 5.5 * 10
      expect(normalized.bloodType).toBe(3);
      expect(normalized.activityLevel).toBe(2);
      expect(normalized.diabetesStatus).toBe(0);
      expect(normalized.heartDiseaseHistory).toBe(0);
    });

    it("should use -1 for missing values", () => {
      const medicalData: ExtractedMedicalData = {};

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.age).toBe(-1);
      expect(normalized.gender).toBe(-1);
      expect(normalized.bmi).toBe(-1);
      expect(normalized.smokingStatus).toBe(-1);
      expect(normalized.region).toBe(-1);
      expect(normalized.cholesterol).toBe(-1);
      expect(normalized.systolicBP).toBe(-1);
      expect(normalized.diastolicBP).toBe(-1);
      expect(normalized.hba1c).toBe(-1);
      expect(normalized.bloodType).toBe(-1);
      expect(normalized.activityLevel).toBe(-1);
      expect(normalized.diabetesStatus).toBe(-1);
      expect(normalized.heartDiseaseHistory).toBe(-1);
    });

    it("should handle partial medical data", () => {
      const medicalData: ExtractedMedicalData = {
        age: 45,
        gender: 2,
        cholesterol: 200,
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.age).toBe(45);
      expect(normalized.gender).toBe(2);
      expect(normalized.cholesterol).toBe(200);
      expect(normalized.bmi).toBe(-1);
      expect(normalized.smokingStatus).toBe(-1);
    });

    it("should round BMI to integer (multiply by 10)", () => {
      const medicalData: ExtractedMedicalData = {
        bmi: 23.456,
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.bmi).toBe(235); // Round(23.456 * 10)
    });

    it("should round HbA1c to integer (multiply by 10)", () => {
      const medicalData: ExtractedMedicalData = {
        hba1c: 6.789,
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.hba1c).toBe(68); // Round(6.789 * 10)
    });

    it("should handle zero values correctly", () => {
      const medicalData: ExtractedMedicalData = {
        age: 0,
        gender: 0,
        smokingStatus: 0,
        diabetesStatus: 0,
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      // Zero should be preserved, not converted to -1
      expect(normalized.age).toBe(0);
      expect(normalized.gender).toBe(0);
      expect(normalized.smokingStatus).toBe(0);
      expect(normalized.diabetesStatus).toBe(0);
    });

    it("should handle first region when multiple regions provided", () => {
      const medicalData: ExtractedMedicalData = {
        regions: [5, 10, 15],
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.region).toBe(5);
    });

    it("should handle empty regions array", () => {
      const medicalData: ExtractedMedicalData = {
        regions: [],
      };

      const normalized = normalizeMedicalDataForCircuit(medicalData);

      expect(normalized.region).toBe(-1);
    });
  });

  describe("generateDataCommitment", () => {
    beforeEach(() => {
      // Reset mocks with deterministic values
      mockPoseidon7.mockReturnValue(BigInt(11111));
      mockPoseidon4.mockReturnValue(BigInt(22222));
    });

    it("should generate commitment from medical data", () => {
      const medicalData: ExtractedMedicalData = {
        age: 30,
        gender: 1,
        bmi: 24.5,
        smokingStatus: 0,
      };

      const salt = 12345;
      const challenge = "0x1234567890abcdef";

      const commitment = generateDataCommitment(medicalData, salt, challenge);

      expect(typeof commitment).toBe("bigint");
      expect(commitment).toBe(BigInt(22222)); // Mocked poseidon4 result
      expect(mockPoseidon7).toHaveBeenCalledTimes(2); // Two commitment hashes
      expect(mockPoseidon4).toHaveBeenCalledTimes(1); // Final commitment
    });

    it("should use salt in commitment generation", () => {
      const medicalData: ExtractedMedicalData = {
        age: 25,
        gender: 2,
      };

      const salt = 67890;
      const challenge = "0xabcdef1234567890";

      generateDataCommitment(medicalData, salt, challenge);

      // Verify salt was passed to poseidon7 (first call, last element)
      expect(mockPoseidon7).toHaveBeenCalled();
      const firstCall = mockPoseidon7.mock.calls[0][0];
      expect(firstCall[firstCall.length - 1]).toBe(BigInt(salt));
    });

    it("should incorporate challenge in commitment", () => {
      const medicalData: ExtractedMedicalData = {
        age: 30,
      };

      const salt = 12345;
      const challenge = "0x123abc";

      generateDataCommitment(medicalData, salt, challenge);

      // Verify challenge was used in poseidon4
      expect(mockPoseidon4).toHaveBeenCalled();
    });

    it("should handle challenge with 0x prefix", () => {
      const medicalData: ExtractedMedicalData = {
        age: 30,
      };

      const salt = 12345;
      const challenge = "0xabcdef123456";

      expect(() => {
        generateDataCommitment(medicalData, salt, challenge);
      }).not.toThrow();
    });

    it("should handle challenge without 0x prefix", () => {
      const medicalData: ExtractedMedicalData = {
        age: 30,
      };

      const salt = 12345;
      const challenge = "abcdef123456";

      expect(() => {
        generateDataCommitment(medicalData, salt, challenge);
      }).not.toThrow();
    });

    it("should normalize medical data before commitment", () => {
      const medicalData: ExtractedMedicalData = {
        bmi: 25.7, // Should be normalized to 257
        hba1c: 6.2, // Should be normalized to 62
      };

      const salt = 12345;
      const challenge = "0x123";

      generateDataCommitment(medicalData, salt, challenge);

      // Verify that poseidon7 was called with normalized values
      expect(mockPoseidon7).toHaveBeenCalled();
    });

    it("should throw error on failure", () => {
      mockPoseidon7.mockImplementation(() => {
        throw new Error("Poseidon hash failed");
      });

      const medicalData: ExtractedMedicalData = {
        age: 30,
      };

      // Suppress error output during test
      const originalConsoleError = console.error;
      console.error = () => {};

      expect(() => {
        generateDataCommitment(medicalData, 12345, "0x123");
      }).toThrow("Data commitment generation failed");

      console.error = originalConsoleError;
    });

    it("should generate deterministic commitment for same inputs", () => {
      mockPoseidon7.mockReturnValue(BigInt(99999));
      mockPoseidon4.mockReturnValue(BigInt(88888));

      const medicalData: ExtractedMedicalData = {
        age: 30,
        gender: 1,
      };

      const salt = 12345;
      const challenge = "0x123abc";

      const commitment1 = generateDataCommitment(medicalData, salt, challenge);
      const commitment2 = generateDataCommitment(medicalData, salt, challenge);

      expect(commitment1).toBe(commitment2);
    });

    it("should handle all medical data fields", () => {
      const completeMedicalData: ExtractedMedicalData = {
        age: 30,
        gender: 1,
        bmi: 24.5,
        smokingStatus: 0,
        regions: [1],
        cholesterol: 180,
        systolicBP: 120,
        diastolicBP: 80,
        hba1c: 5.5,
        bloodType: 3,
        activityLevel: 2,
        diabetesStatus: 0,
        heartDiseaseStatus: 0,
      };

      const salt = 12345;
      const challenge = "0x123";

      const commitment = generateDataCommitment(completeMedicalData, salt, challenge);

      expect(typeof commitment).toBe("bigint");
      expect(mockPoseidon7).toHaveBeenCalledTimes(2);
      expect(mockPoseidon4).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration", () => {
    it("should work with generateSecureSalt", () => {
      mockPoseidon7.mockReturnValue(BigInt(11111));
      mockPoseidon4.mockReturnValue(BigInt(22222));

      const medicalData: ExtractedMedicalData = {
        age: 30,
        gender: 1,
      };

      const salt = generateSecureSalt();
      const challenge = "0x123abc";

      const commitment = generateDataCommitment(medicalData, salt, challenge);

      expect(typeof commitment).toBe("bigint");
      expect(typeof salt).toBe("number");
    });

    it("should produce different commitments with different salts", () => {
      let callCount = 0;
      mockPoseidon4.mockImplementation(() => {
        callCount++;
        return BigInt(10000 + callCount);
      });

      const medicalData: ExtractedMedicalData = {
        age: 30,
      };

      const salt1 = 11111;
      const salt2 = 22222;
      const challenge = "0x123";

      const commitment1 = generateDataCommitment(medicalData, salt1, challenge);
      const commitment2 = generateDataCommitment(medicalData, salt2, challenge);

      // Due to different salts, final results should differ
      expect(commitment1).not.toBe(commitment2);
    });
  });
});

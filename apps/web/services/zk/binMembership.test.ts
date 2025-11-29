import { describe, it, expect } from "bun:test";
import { BinType, DataBin, BinConfiguration } from "@zk-medical/shared";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";
import {
  computeParticipantBins,
  checkBinMembership,
  validateBinMembership,
  createBinMembershipBitmap,
} from "./binMembership";

describe("Bin Membership", () => {
  const createBin = (overrides: Partial<DataBin>): DataBin => ({
    id: "test_bin",
    numericId: 0,
    criteriaField: "age",
    type: BinType.RANGE,
    label: "Test Bin",
    ...overrides,
  });
  describe("checkBinMembership", () => {
    describe("Range bins", () => {
      it("should match value in range with default inclusivity [min, max)", () => {
        const bin = createBin({
          id: "age_bin_0",
          type: BinType.RANGE,
          criteriaField: "age",
          minValue: 18,
          maxValue: 30,
        });

        const userData: ExtractedMedicalData = { age: 25 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should match minimum value when includeMin is true", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          includeMin: true,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 18 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should not match minimum value when includeMin is false", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          includeMin: false,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 18 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should not match maximum value when includeMax is false", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          includeMax: false,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 30 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should match maximum value when includeMax is true", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          includeMax: true,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 30 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should not match value below range", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 15 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should not match value above range", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 35 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should handle BMI range bin", () => {
        const bin: DataBin = {
          id: "bmi_bin_normal",
          numericId: 1,
          criteriaField: "bmi",
          type: BinType.RANGE,
          minValue: 18.5,
          maxValue: 25,
          label: "",
        };

        const userData: ExtractedMedicalData = { bmi: 22.5 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should return false if field value is undefined", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          minValue: 18,
          maxValue: 30,
          label: "",
        };

        const userData: ExtractedMedicalData = {};

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should return false if minValue or maxValue is undefined", () => {
        const bin: DataBin = {
          id: "age_bin_0",
          numericId: 0,
          criteriaField: "age",
          type: BinType.RANGE,
          label: "",
        };

        const userData: ExtractedMedicalData = { age: 25 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });
    });

    describe("Categorical bins", () => {
      it("should match value in categories", () => {
        const bin: DataBin = {
          id: "gender_bin_male",
          numericId: 2,
          criteriaField: "gender",
          type: BinType.CATEGORICAL,
          categories: [1],
          label: "",
        };

        const userData: ExtractedMedicalData = { gender: 1 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should not match value not in categories", () => {
        const bin: DataBin = {
          id: "gender_bin_male",
          numericId: 2,
          criteriaField: "gender",
          type: BinType.CATEGORICAL,
          categories: [1],
          label: "",
        };

        const userData: ExtractedMedicalData = { gender: 2 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should match value in multiple categories", () => {
        const bin: DataBin = {
          id: "blood_type_bin",
          numericId: 3,
          criteriaField: "bloodType",
          type: BinType.CATEGORICAL,
          categories: [1, 2, 3],
          label: "",
        };

        const userData: ExtractedMedicalData = { bloodType: 2 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should return false if categories is empty", () => {
        const bin: DataBin = {
          id: "gender_bin",
          numericId: 2,
          criteriaField: "gender",
          type: BinType.CATEGORICAL,
          categories: [],
          label: "",
        };

        const userData: ExtractedMedicalData = { gender: 1 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should return false if categories is undefined", () => {
        const bin: DataBin = {
          id: "gender_bin",
          numericId: 2,
          criteriaField: "gender",
          type: BinType.CATEGORICAL,
          label: "",
        };

        const userData: ExtractedMedicalData = { gender: 1 };

        expect(checkBinMembership(userData, bin)).toBe(false);
      });

      it("should return false if field value is undefined", () => {
        const bin: DataBin = {
          id: "gender_bin",
          numericId: 2,
          criteriaField: "gender",
          type: BinType.CATEGORICAL,
          categories: [1, 2],
          label: "",
        };

        const userData: ExtractedMedicalData = {};

        expect(checkBinMembership(userData, bin)).toBe(false);
      });
    });

    describe("Different medical fields", () => {
      it("should handle cholesterol bin", () => {
        const bin: DataBin = {
          id: "cholesterol_high",
          numericId: 4,
          criteriaField: "cholesterol",
          type: BinType.RANGE,
          minValue: 200,
          maxValue: 240,
          label: "",
        };

        const userData: ExtractedMedicalData = { cholesterol: 220 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should handle systolicBP bin", () => {
        const bin: DataBin = {
          id: "bp_normal",
          numericId: 5,
          criteriaField: "systolicBP",
          type: BinType.RANGE,
          minValue: 90,
          maxValue: 120,
          label: "",
        };

        const userData: ExtractedMedicalData = { systolicBP: 110 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });

      it("should handle diabetesStatus categorical bin", () => {
        const bin: DataBin = {
          id: "diabetes_positive",
          numericId: 6,
          criteriaField: "diabetesStatus",
          type: BinType.CATEGORICAL,
          categories: [1],
          label: "",
        };

        const userData: ExtractedMedicalData = { diabetesStatus: 1 };

        expect(checkBinMembership(userData, bin)).toBe(true);
      });
    });
  });

  describe("computeParticipantBins", () => {
    it("should compute bins for user matching multiple bins", () => {
      const binConfig: BinConfiguration = {
        bins: [
          {
            id: "age_bin_young",
            numericId: 0,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 18,
            maxValue: 30,
            label: "",
          },
          {
            id: "gender_bin_male",
            numericId: 1,
            criteriaField: "gender",
            type: BinType.CATEGORICAL,
            categories: [1],
            label: "",
          },
          {
            id: "age_bin_old",
            numericId: 2,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 60,
            maxValue: 80,
            label: "",
          },
        ],
      };

      const userData: ExtractedMedicalData = {
        age: 25,
        gender: 1,
      };

      const result = computeParticipantBins(userData, binConfig);

      expect(result.binIds).toEqual(["age_bin_young", "gender_bin_male"]);
      expect(result.numericBinIds).toEqual([0, 1]);
      expect(result.binIndices).toEqual([0, 1]);
      expect(result.binCount).toBe(2);
      expect(result.fieldCoverage).toEqual({ age: true, gender: true });
    });

    it("should return empty arrays if no bins match", () => {
      const binConfig: BinConfiguration = {
        bins: [
          {
            id: "age_bin_old",
            numericId: 0,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 60,
            maxValue: 80,
            label: "",
          },
        ],
      };

      const userData: ExtractedMedicalData = {
        age: 25,
      };

      const result = computeParticipantBins(userData, binConfig);

      expect(result.binIds).toEqual([]);
      expect(result.numericBinIds).toEqual([]);
      expect(result.binIndices).toEqual([]);
      expect(result.binCount).toBe(0);
      expect(result.fieldCoverage).toEqual({});
    });

    it("should handle user matching all bins", () => {
      const binConfig: BinConfiguration = {
        bins: [
          {
            id: "age_bin",
            numericId: 0,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 20,
            maxValue: 30,
            label: "",
          },
          {
            id: "bmi_bin",
            numericId: 1,
            criteriaField: "bmi",
            type: BinType.RANGE,
            minValue: 18,
            maxValue: 25,
            label: "",
          },
        ],
      };

      const userData: ExtractedMedicalData = {
        age: 25,
        bmi: 22,
      };

      const result = computeParticipantBins(userData, binConfig);

      expect(result.binCount).toBe(2);
      expect(result.binIds.length).toBe(2);
    });

    it("should track field coverage correctly", () => {
      const binConfig: BinConfiguration = {
        bins: [
          {
            id: "age_bin_1",
            numericId: 0,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 20,
            maxValue: 30,
            label: "",
          },
          {
            id: "age_bin_2",
            numericId: 1,
            criteriaField: "age",
            type: BinType.RANGE,
            minValue: 30,
            maxValue: 40,
            label: "",
          },
          {
            id: "gender_bin",
            numericId: 2,
            criteriaField: "gender",
            type: BinType.CATEGORICAL,
            categories: [1],
            label: "",
          },
        ],
      };

      const userData: ExtractedMedicalData = {
        age: 25,
        gender: 1,
      };

      const result = computeParticipantBins(userData, binConfig);

      expect(result.fieldCoverage).toEqual({ age: true, gender: true });
    });
  });

  describe("validateBinMembership", () => {
    it("should validate complete field coverage", () => {
      const membershipResult = {
        binIds: ["age_bin", "gender_bin"],
        numericBinIds: [0, 1],
        binIndices: [0, 1],
        binCount: 2,
        fieldCoverage: { age: true, gender: true },
      };

      const requiredFields = ["age", "gender"];

      const validation = validateBinMembership(membershipResult, requiredFields);

      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toEqual([]);
    });

    it("should detect missing required fields", () => {
      const membershipResult = {
        binIds: ["age_bin"],
        numericBinIds: [0],
        binIndices: [0],
        binCount: 1,
        fieldCoverage: { age: true },
      };

      const requiredFields = ["age", "gender", "bmi"];

      const validation = validateBinMembership(membershipResult, requiredFields);

      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toEqual(["gender", "bmi"]);
    });

    it("should handle empty required fields", () => {
      const membershipResult = {
        binIds: [],
        numericBinIds: [],
        binIndices: [],
        binCount: 0,
        fieldCoverage: {},
      };

      const requiredFields: string[] = [];

      const validation = validateBinMembership(membershipResult, requiredFields);

      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toEqual([]);
    });

    it("should handle partial field coverage", () => {
      const membershipResult = {
        binIds: ["age_bin", "bmi_bin"],
        numericBinIds: [0, 1],
        binIndices: [0, 1],
        binCount: 2,
        fieldCoverage: { age: true, bmi: true },
      };

      const requiredFields = ["age", "gender", "bmi", "cholesterol"];

      const validation = validateBinMembership(membershipResult, requiredFields);

      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toEqual(["gender", "cholesterol"]);
    });
  });

  describe("createBinMembershipBitmap", () => {
    it("should create bitmap with matched bins set to 1", () => {
      const binIndices = [0, 2, 4];
      const totalBins = 5;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([1, 0, 1, 0, 1]);
    });

    it("should create all-zeros bitmap if no bins matched", () => {
      const binIndices: number[] = [];
      const totalBins = 5;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([0, 0, 0, 0, 0]);
    });

    it("should create all-ones bitmap if all bins matched", () => {
      const binIndices = [0, 1, 2, 3];
      const totalBins = 4;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([1, 1, 1, 1]);
    });

    it("should handle single bin", () => {
      const binIndices = [0];
      const totalBins = 3;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([1, 0, 0]);
    });

    it("should ignore out-of-bounds indices", () => {
      const binIndices = [0, 2, 10]; // 10 is out of bounds
      const totalBins = 5;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([1, 0, 1, 0, 0]);
    });

    it("should ignore negative indices", () => {
      const binIndices = [-1, 1, 3];
      const totalBins = 5;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      expect(bitmap).toEqual([0, 1, 0, 1, 0]);
    });

    it("should handle duplicate indices", () => {
      const binIndices = [1, 1, 2, 2];
      const totalBins = 4;

      const bitmap = createBinMembershipBitmap(binIndices, totalBins);

      // Duplicates should still result in 1 at that index
      expect(bitmap).toEqual([0, 1, 1, 0]);
    });
  });
});

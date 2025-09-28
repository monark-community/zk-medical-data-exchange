import { Contract, JsonRpcProvider } from "ethers";
import { useState, useEffect } from "react";
import {
  StudyCriteria,
  STUDY_TEMPLATES,
  createCriteria,
  validateCriteria,
  countEnabledCriteria,
  getStudyComplexity,
} from "../../../packages/shared/studyCriteria";

/**
 * Frontend service that maps study criteria to form fields
 * This tells the frontend exactly which fields each study requires
 */

// Using shared StudyCriteria interface from packages/shared/studyCriteria.ts

// Frontend form structure - what users see
export interface StudyFormFields {
  demographics: {
    ageRequired: boolean;
    ageRange?: [number, number];
    genderRequired: boolean;
    allowedGender?: "any" | "male" | "female";
    locationRequired: boolean;
    allowedRegions?: string[];
  };
  vitals: {
    cholesterolRequired: boolean;
    cholesterolRange?: [number, number];
    bmiRequired: boolean;
    bmiRange?: [number, number];
    bloodPressureRequired: boolean;
    bloodPressureRange?: {
      systolic: [number, number];
      diastolic: [number, number];
    };
    bloodTypeRequired: boolean;
    allowedBloodTypes?: string[];
  };
  lifestyle: {
    hba1cRequired: boolean;
    hba1cRange?: [number, number];
    smokingRequired: boolean;
    allowedSmoking?: "non-smoker" | "smoker" | "former" | "any";
    activityRequired: boolean;
    activityRange?: [number, number];
  };
  medical: {
    diabetesRequired: boolean;
    allowedDiabetes?: "none" | "type1" | "type2" | "any";
    heartDiseaseRequired: boolean;
    allowedHeartDisease?: "none" | "history" | "any";
  };
}

// Mapping functions
const bloodTypeMap: { [key: number]: string } = {
  1: "A+",
  2: "A-",
  3: "B+",
  4: "B-",
  5: "AB+",
  6: "AB-",
  7: "O+",
  8: "O-",
};

const genderMap: { [key: number]: "any" | "male" | "female" } = {
  0: "any",
  1: "male",
  2: "female",
  3: "any",
};

const smokingMap: { [key: number]: "non-smoker" | "smoker" | "former" | "any" } = {
  0: "non-smoker",
  1: "smoker",
  2: "former",
  3: "any",
};

/**
 * Fetch study criteria from blockchain and convert to frontend form structure
 */
export const getStudyFormFields = async (
  studyAddress: string,
  provider: JsonRpcProvider
): Promise<StudyFormFields> => {
  // Minimal ABI - just the criteria getter
  const studyABI = [
    "function getStudyCriteria() external view returns (tuple(uint256 enableAge, uint256 minAge, uint256 maxAge, uint256 enableCholesterol, uint256 minCholesterol, uint256 maxCholesterol, uint256 enableBMI, uint256 minBMI, uint256 maxBMI, uint256 enableBloodType, uint256[4] allowedBloodTypes, uint256 enableGender, uint256 allowedGender, uint256 enableLocation, uint256[4] allowedRegions, uint256 enableBloodPressure, uint256 minSystolic, uint256 maxSystolic, uint256 minDiastolic, uint256 maxDiastolic, uint256 enableHbA1c, uint256 minHbA1c, uint256 maxHbA1c, uint256 enableSmoking, uint256 allowedSmoking, uint256 enableActivity, uint256 minActivityLevel, uint256 maxActivityLevel, uint256 enableDiabetes, uint256 allowedDiabetes, uint256 enableHeartDisease, uint256 allowedHeartDisease))",
  ];

  const contract = new Contract(studyAddress, studyABI, provider);
  const criteria: StudyCriteria = await contract.getStudyCriteria();

  // Convert blockchain data to frontend form structure - ALL criteria are optional now!
  return {
    demographics: {
      ageRequired: criteria.enableAge === 1,
      ageRange: criteria.enableAge === 1 ? [criteria.minAge, criteria.maxAge] : undefined,
      genderRequired: criteria.enableGender === 1,
      allowedGender: genderMap[criteria.allowedGender],
      locationRequired: criteria.enableLocation === 1,
      allowedRegions: criteria.allowedRegions
        .filter((region) => region > 0)
        .map((region) => `Region ${region}`),
    },
    vitals: {
      cholesterolRequired: criteria.enableCholesterol === 1,
      cholesterolRange:
        criteria.enableCholesterol === 1
          ? [criteria.minCholesterol, criteria.maxCholesterol]
          : undefined,
      bmiRequired: criteria.enableBMI === 1,
      bmiRange:
        criteria.enableBMI === 1
          ? [criteria.minBMI / 10, criteria.maxBMI / 10] // Convert back from scaled
          : undefined,
      bloodPressureRequired: criteria.enableBloodPressure === 1,
      bloodPressureRange:
        criteria.enableBloodPressure === 1
          ? {
              systolic: [criteria.minSystolic, criteria.maxSystolic],
              diastolic: [criteria.minDiastolic, criteria.maxDiastolic],
            }
          : undefined,
      bloodTypeRequired: criteria.enableBloodType === 1,
      allowedBloodTypes:
        criteria.enableBloodType === 1
          ? criteria.allowedBloodTypes.filter((type) => type > 0).map((type) => bloodTypeMap[type])
          : undefined,
    },
    lifestyle: {
      hba1cRequired: criteria.enableHbA1c === 1,
      hba1cRange:
        criteria.enableHbA1c === 1
          ? [criteria.minHbA1c / 10, criteria.maxHbA1c / 10] // Convert from scaled
          : undefined,
      smokingRequired: criteria.enableSmoking === 1,
      allowedSmoking:
        criteria.enableSmoking === 1 ? smokingMap[criteria.allowedSmoking] : undefined,
      activityRequired: criteria.enableActivity === 1,
      activityRange:
        criteria.enableActivity === 1
          ? [criteria.minActivityLevel, criteria.maxActivityLevel]
          : undefined,
    },
    medical: {
      diabetesRequired: criteria.enableDiabetes === 1,
      allowedDiabetes:
        criteria.enableDiabetes === 1
          ? (["none", "type1", "type2", "any"][criteria.allowedDiabetes] as any)
          : undefined,
      heartDiseaseRequired: criteria.enableHeartDisease === 1,
      allowedHeartDisease:
        criteria.enableHeartDisease === 1
          ? (["none", "history", "any"][criteria.allowedHeartDisease] as any)
          : undefined,
    },
  };
};

/**
 * Get public inputs for ZK proof generation
 * This maps study criteria to the exact format the ZK circuit expects
 */
export const getZKPublicInputs = async (
  studyAddress: string,
  provider: JsonRpcProvider
): Promise<number[]> => {
  const studyABI = [
    "function getStudyCriteria() external view returns (tuple(uint256 enableAge, uint256 minAge, uint256 maxAge, uint256 enableCholesterol, uint256 minCholesterol, uint256 maxCholesterol, uint256 enableBMI, uint256 minBMI, uint256 maxBMI, uint256 enableBloodType, uint256[4] allowedBloodTypes, uint256 enableGender, uint256 allowedGender, uint256 enableLocation, uint256[4] allowedRegions, uint256 enableBloodPressure, uint256 minSystolic, uint256 maxSystolic, uint256 minDiastolic, uint256 maxDiastolic, uint256 enableHbA1c, uint256 minHbA1c, uint256 maxHbA1c, uint256 enableSmoking, uint256 allowedSmoking, uint256 enableActivity, uint256 minActivityLevel, uint256 maxActivityLevel, uint256 enableDiabetes, uint256 allowedDiabetes, uint256 enableHeartDisease, uint256 allowedHeartDisease))",
  ];

  const contract = new Contract(studyAddress, studyABI, provider);
  const criteria: StudyCriteria = await contract.getStudyCriteria();

  // Return array in EXACT order that ZK circuit expects
  // ALL criteria are optional - enable flags determine which are checked
  return [
    // Age criteria (optional with enableAge flag)
    criteria.enableAge,
    criteria.minAge,
    criteria.maxAge,

    // Cholesterol criteria (optional with enableCholesterol flag)
    criteria.enableCholesterol,
    criteria.minCholesterol,
    criteria.maxCholesterol,

    // BMI criteria (optional with enableBMI flag)
    criteria.enableBMI,
    criteria.minBMI,
    criteria.maxBMI,

    // Blood type criteria (optional with enableBloodType flag)
    criteria.enableBloodType,
    ...criteria.allowedBloodTypes,

    // Gender criteria (optional with enableGender flag)
    criteria.enableGender,
    criteria.allowedGender,

    // Location criteria (optional with enableLocation flag)
    criteria.enableLocation,
    ...criteria.allowedRegions,

    // Blood pressure criteria (optional with enableBloodPressure flag)
    criteria.enableBloodPressure,
    criteria.minSystolic,
    criteria.maxSystolic,
    criteria.minDiastolic,
    criteria.maxDiastolic,

    // HbA1c criteria (optional with enableHbA1c flag)
    criteria.enableHbA1c,
    criteria.minHbA1c,
    criteria.maxHbA1c,

    // Smoking criteria (optional with enableSmoking flag)
    criteria.enableSmoking,
    criteria.allowedSmoking,

    // Activity level criteria (optional with enableActivity flag)
    criteria.enableActivity,
    criteria.minActivityLevel,
    criteria.maxActivityLevel,

    // Diabetes criteria (optional with enableDiabetes flag)
    criteria.enableDiabetes,
    criteria.allowedDiabetes,

    // Heart disease criteria (optional with enableHeartDisease flag)
    criteria.enableHeartDisease,
    criteria.allowedHeartDisease,
  ];
};

/**
 * Example usage in a React component
 */
export const useStudyFields = (studyAddress: string) => {
  const [formFields, setFormFields] = useState<StudyFormFields | null>(null);
  const [zkInputs, setZkInputs] = useState<number[]>([]);

  useEffect(() => {
    const loadStudyData = async () => {
      // Get provider (adjust for your setup)
      const provider = new JsonRpcProvider(process.env.RPC_URL);

      // Load both form structure and ZK inputs
      const [fields, inputs] = await Promise.all([
        getStudyFormFields(studyAddress, provider),
        getZKPublicInputs(studyAddress, provider),
      ]);

      setFormFields(fields);
      setZkInputs(inputs);
    };

    if (studyAddress) {
      loadStudyData();
    }
  }, [studyAddress]);

  return { formFields, zkInputs };
};

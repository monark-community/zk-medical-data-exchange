/**
 * FHIR Integration Service
 * Integrates FHIR data processing with study criteria validation and ZK proof generation
 */

import { StudyCriteria } from "@zk-medical/shared";
import { extractZKValuesFromFHIR } from "./fhirToZkMappings";

export interface FHIRDataBundle {
  resources: any[];
  patientId?: string;
  timestamp: Date;
}

export interface ExtractedMedicalData {
  age?: number;
  gender?: number;
  bloodType?: number;
  smokingStatus?: number;
  activityLevel?: number;
  diabetesStatus?: number;
  heartDiseaseStatus?: number;
  regions?: number[];
  cholesterol?: number;
  bmi?: number;
  systolicBP?: number;
  diastolicBP?: number;
  hba1c?: number;
}

export interface StudyEligibilityResult {
  isEligible: boolean;
  matchedCriteria: string[];
  missingCriteria: string[];
  extractedData: ExtractedMedicalData;
  zkReadyValues: { [key: string]: number | number[] };
}

/**
 * Process FHIR Bundle or individual resources to extract medical data
 */
export const processFHIRData = (fhirData: any): ExtractedMedicalData => {
  let allExtractedData: ExtractedMedicalData = {};

  // Handle FHIR Bundle
  if (fhirData.resourceType === "Bundle" && fhirData.entry) {
    for (const entry of fhirData.entry) {
      if (entry.resource) {
        const resourceData = extractZKValuesFromFHIR(entry.resource);
        allExtractedData = { ...allExtractedData, ...resourceData };
      }
    }
  }
  // Handle individual FHIR resources
  else if (fhirData.resourceType) {
    allExtractedData = extractZKValuesFromFHIR(fhirData);
  }
  // Handle array of resources
  else if (Array.isArray(fhirData)) {
    for (const resource of fhirData) {
      if (resource.resourceType) {
        const resourceData = extractZKValuesFromFHIR(resource);
        allExtractedData = { ...allExtractedData, ...resourceData };
      }
    }
  }

  return allExtractedData;
};

/**
 * Validate FHIR data compliance before processing
 */
export const validateFHIRData = (fhirData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Basic FHIR structure validation
    if (!fhirData || typeof fhirData !== "object") {
      errors.push("Data must be a valid JSON object");
    } else if (!fhirData.resourceType) {
      errors.push("Data must have a resourceType field");
    }

    // Check for required resource types
    let hasPatient = false;
    let hasObservationOrCondition = false;

    if (fhirData.resourceType === "Bundle" && fhirData.entry) {
      for (const entry of fhirData.entry) {
        if (entry.resource?.resourceType === "Patient") {
          hasPatient = true;
        }
        if (
          entry.resource?.resourceType === "Observation" ||
          entry.resource?.resourceType === "Condition"
        ) {
          hasObservationOrCondition = true;
        }
      }
    } else if (fhirData.resourceType === "Patient") {
      hasPatient = true;
    } else if (fhirData.resourceType === "Observation" || fhirData.resourceType === "Condition") {
      hasObservationOrCondition = true;
    }

    if (!hasPatient && !hasObservationOrCondition) {
      errors.push(
        "FHIR data must contain at least Patient demographics or medical Observations/Conditions"
      );
    }
  } catch (error) {
    errors.push(
      `FHIR validation error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check study eligibility based on extracted FHIR data against study criteria
 */
export const checkStudyEligibility = (
  extractedData: ExtractedMedicalData,
  studyCriteria: StudyCriteria
): StudyEligibilityResult => {
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  const zkReadyValues: { [key: string]: number | number[] } = {};

  // Check age criteria
  if (studyCriteria.enableAge === 1) {
    if (extractedData.age !== undefined) {
      const ageInRange =
        extractedData.age >= studyCriteria.minAge && extractedData.age <= studyCriteria.maxAge;

      if (ageInRange) {
        matchedCriteria.push("age");
        zkReadyValues.age = extractedData.age;
      } else {
        missingCriteria.push(
          `age (${extractedData.age} not in range ${studyCriteria.minAge}-${studyCriteria.maxAge})`
        );
      }
    } else {
      missingCriteria.push("age (not found in FHIR data)");
    }
  }

  // Check cholesterol criteria
  if (studyCriteria.enableCholesterol === 1) {
    if (extractedData.cholesterol !== undefined) {
      const cholesterolInRange =
        extractedData.cholesterol >= studyCriteria.minCholesterol &&
        extractedData.cholesterol <= studyCriteria.maxCholesterol;

      if (cholesterolInRange) {
        matchedCriteria.push("cholesterol");
        zkReadyValues.cholesterol = extractedData.cholesterol;
      } else {
        missingCriteria.push(
          `cholesterol (${extractedData.cholesterol} not in range ${studyCriteria.minCholesterol}-${studyCriteria.maxCholesterol})`
        );
      }
    } else {
      missingCriteria.push("cholesterol (not found in FHIR data)");
    }
  }

  // Check BMI criteria
  if (studyCriteria.enableBMI === 1) {
    if (extractedData.bmi !== undefined) {
      const bmiInRange =
        extractedData.bmi >= studyCriteria.minBMI && extractedData.bmi <= studyCriteria.maxBMI;

      if (bmiInRange) {
        matchedCriteria.push("bmi");
        zkReadyValues.bmi = extractedData.bmi;
      } else {
        missingCriteria.push(
          `bmi (${extractedData.bmi} not in range ${studyCriteria.minBMI}-${studyCriteria.maxBMI})`
        );
      }
    } else {
      missingCriteria.push("bmi (not found in FHIR data)");
    }
  }

  // Check blood pressure criteria
  if (studyCriteria.enableBloodPressure === 1) {
    if (extractedData.systolicBP !== undefined) {
      const bpInRange =
        extractedData.systolicBP >= studyCriteria.minSystolic &&
        extractedData.systolicBP <= studyCriteria.maxSystolic;

      if (bpInRange) {
        matchedCriteria.push("systolicBP");
        zkReadyValues.systolicBP = extractedData.systolicBP;
      } else {
        missingCriteria.push(
          `systolicBP (${extractedData.systolicBP} not in range ${studyCriteria.minSystolic}-${studyCriteria.maxSystolic})`
        );
      }
    } else {
      missingCriteria.push("systolicBP (not found in FHIR data)");
    }
  }

  // Check HbA1c criteria
  if (studyCriteria.enableHbA1c === 1) {
    if (extractedData.hba1c !== undefined) {
      const hba1cInRange =
        extractedData.hba1c >= studyCriteria.minHbA1c &&
        extractedData.hba1c <= studyCriteria.maxHbA1c;

      if (hba1cInRange) {
        matchedCriteria.push("hba1c");
        zkReadyValues.hba1c = extractedData.hba1c;
      } else {
        missingCriteria.push(
          `hba1c (${extractedData.hba1c} not in range ${studyCriteria.minHbA1c}-${studyCriteria.maxHbA1c})`
        );
      }
    } else {
      missingCriteria.push("hba1c (not found in FHIR data)");
    }
  }

  // Check blood type
  if (studyCriteria.enableBloodType === 1) {
    if (extractedData.bloodType !== undefined) {
      const isAllowedBloodType = studyCriteria.allowedBloodTypes.includes(
        extractedData.bloodType as any
      );
      if (isAllowedBloodType) {
        matchedCriteria.push("bloodType");
        zkReadyValues.bloodType = extractedData.bloodType;
      } else {
        missingCriteria.push(`bloodType (${extractedData.bloodType} not in allowed types)`);
      }
    } else {
      missingCriteria.push("bloodType (not found in FHIR data)");
    }
  }

  // Check gender
  if (studyCriteria.enableGender === 1) {
    if (extractedData.gender !== undefined) {
      if (studyCriteria.allowedGender === extractedData.gender) {
        matchedCriteria.push("gender");
        zkReadyValues.gender = extractedData.gender;
      } else {
        missingCriteria.push(
          `gender (${extractedData.gender} does not match required ${studyCriteria.allowedGender})`
        );
      }
    } else {
      missingCriteria.push("gender (not found in FHIR data)");
    }
  }

  // Check smoking status
  if (studyCriteria.enableSmoking === 1) {
    if (extractedData.smokingStatus !== undefined) {
      if (studyCriteria.allowedSmoking === extractedData.smokingStatus) {
        matchedCriteria.push("smokingStatus");
        zkReadyValues.smokingStatus = extractedData.smokingStatus;
      } else {
        missingCriteria.push(
          `smokingStatus (${extractedData.smokingStatus} does not match required ${studyCriteria.allowedSmoking})`
        );
      }
    } else {
      missingCriteria.push("smokingStatus (not found in FHIR data)");
    }
  }

  // Check activity level
  if (studyCriteria.enableActivity === 1) {
    if (extractedData.activityLevel !== undefined) {
      const activityInRange =
        extractedData.activityLevel >= studyCriteria.minActivityLevel &&
        extractedData.activityLevel <= studyCriteria.maxActivityLevel;
      if (activityInRange) {
        matchedCriteria.push("activityLevel");
        zkReadyValues.activityLevel = extractedData.activityLevel;
      } else {
        missingCriteria.push(
          `activityLevel (${extractedData.activityLevel} not in range ${studyCriteria.minActivityLevel}-${studyCriteria.maxActivityLevel})`
        );
      }
    } else {
      missingCriteria.push("activityLevel (not found in FHIR data)");
    }
  }

  // Check diabetes status
  if (studyCriteria.enableDiabetes === 1) {
    if (extractedData.diabetesStatus !== undefined) {
      if (studyCriteria.allowedDiabetes === extractedData.diabetesStatus) {
        matchedCriteria.push("diabetesStatus");
        zkReadyValues.diabetesStatus = extractedData.diabetesStatus;
      } else {
        missingCriteria.push(
          `diabetesStatus (${extractedData.diabetesStatus} does not match required ${studyCriteria.allowedDiabetes})`
        );
      }
    } else {
      missingCriteria.push("diabetesStatus (not found in FHIR data)");
    }
  }

  // Check heart disease status
  if (studyCriteria.enableHeartDisease === 1) {
    if (extractedData.heartDiseaseStatus !== undefined) {
      if (studyCriteria.allowedHeartDisease === extractedData.heartDiseaseStatus) {
        matchedCriteria.push("heartDiseaseStatus");
        zkReadyValues.heartDiseaseStatus = extractedData.heartDiseaseStatus;
      } else {
        missingCriteria.push(
          `heartDiseaseStatus (${extractedData.heartDiseaseStatus} does not match required ${studyCriteria.allowedHeartDisease})`
        );
      }
    } else {
      missingCriteria.push("heartDiseaseStatus (not found in FHIR data)");
    }
  }

  // Check regions (special case - array matching)
  if (studyCriteria.enableLocation === 1) {
    if (extractedData.regions && extractedData.regions.length > 0) {
      const hasMatchingRegion = studyCriteria.allowedRegions.some((requiredRegion: number) =>
        extractedData.regions!.includes(requiredRegion)
      );

      if (hasMatchingRegion) {
        matchedCriteria.push("regions");
        zkReadyValues.regions = extractedData.regions;
      } else {
        missingCriteria.push(
          `regions (${extractedData.regions.join(
            ","
          )} do not match required ${studyCriteria.allowedRegions.join(",")})`
        );
      }
    } else {
      missingCriteria.push("regions (not found in FHIR data)");
    }
  }

  const isEligible = missingCriteria.length === 0;

  return {
    isEligible,
    matchedCriteria,
    missingCriteria,
    extractedData,
    zkReadyValues,
  };
};

/**
 * Complete FHIR to ZK proof pipeline
 */
export const processFHIRForStudy = (
  fhirData: any,
  studyCriteria: StudyCriteria
): {
  validation: { isValid: boolean; errors: string[] };
  eligibility?: StudyEligibilityResult;
} => {
  // Step 1: Validate FHIR data
  const validation = validateFHIRData(fhirData);

  if (!validation.isValid) {
    return { validation };
  }

  // Step 2: Extract medical data from FHIR
  const extractedData = processFHIRData(fhirData);

  // Step 3: Check study eligibility
  const eligibility = checkStudyEligibility(extractedData, studyCriteria);

  return {
    validation,
    eligibility,
  };
};

/**
 * Utility function to get human-readable summary of FHIR data processing
 */
export const getFHIRProcessingSummary = (result: {
  validation: { isValid: boolean; errors: string[] };
  eligibility?: StudyEligibilityResult;
}): string => {
  if (!result.validation.isValid) {
    return `FHIR Validation Failed: ${result.validation.errors.join(", ")}`;
  }

  if (!result.eligibility) {
    return "No eligibility check performed";
  }

  const { eligibility } = result;

  if (eligibility.isEligible) {
    return `✅ Patient is eligible! Matched criteria: ${eligibility.matchedCriteria.join(", ")}`;
  } else {
    return `❌ Patient is not eligible. Missing: ${eligibility.missingCriteria.join(", ")}`;
  }
};

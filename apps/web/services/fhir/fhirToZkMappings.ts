import {
  FHIR_GENDER_CODES,
  FHIR_BLOOD_TYPE_SNOMED,
  FHIR_BLOOD_TYPE_TEXT,
  FHIR_SMOKING_SNOMED,
  FHIR_SMOKING_TEXT,
  FHIR_DIABETES_ICD10,
  FHIR_DIABETES_SNOMED,
  FHIR_HEART_DISEASE_ICD10,
  FHIR_HEART_DISEASE_SNOMED,
  COUNTRY_TO_REGION,
  ACTIVITY_LEVEL_VALUES,
  SMOKING_VALUES,
  DIABETES_VALUES,
  HEART_DISEASE_VALUES,
  FHIR_ACTIVITY_LEVEL_SNOMED,
} from "@/constants/medicalDataConstants";
import { AggregatedMedicalData } from "./types/aggregatedMedicalData";
import { ExtractedMedicalData } from "./types/extractedMedicalData";

// TODO: [LT] Verify when generating zkproof if everything in this file is actually useful/needed

// ========================================
// GENDER MAPPINGS (FHIR Patient.gender)
// ========================================

/**
 * Maps FHIR gender codes to ZK circuit values
 * FHIR: http://hl7.org/fhir/administrative-gender
 */
export const fhirGenderToZK = (fhirGender: string): number => {
  return FHIR_GENDER_CODES[fhirGender.toLowerCase() as keyof typeof FHIR_GENDER_CODES] || 0;
};

// ========================================
// BLOOD TYPE MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR blood type codes to ZK circuit values
 * FHIR uses SNOMED CT codes for blood types
 */
export const fhirBloodTypeToZK = (fhirBloodType: string): number => {
  console.log("Mapping FHIR blood type:", fhirBloodType);
  
  // Check SNOMED CT codes first
  if (FHIR_BLOOD_TYPE_SNOMED[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_SNOMED]) {
    return FHIR_BLOOD_TYPE_SNOMED[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_SNOMED];
  }

  // Check text representations
  if (FHIR_BLOOD_TYPE_TEXT[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_TEXT]) {
    return FHIR_BLOOD_TYPE_TEXT[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_TEXT];
  }

  return -1; // Unknown blood type
};

// ========================================
// SMOKING STATUS MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR smoking status codes to ZK circuit values
 * FHIR uses SNOMED CT codes for smoking status
 */
export const fhirSmokingStatusToZK = (smokingCode: string): number => {
  if (FHIR_SMOKING_SNOMED[smokingCode as keyof typeof FHIR_SMOKING_SNOMED]) {
    return FHIR_SMOKING_SNOMED[smokingCode as keyof typeof FHIR_SMOKING_SNOMED];
  }

  const lowerCode = smokingCode.toLowerCase();
  if (FHIR_SMOKING_TEXT[lowerCode as keyof typeof FHIR_SMOKING_TEXT]) {
    return FHIR_SMOKING_TEXT[lowerCode as keyof typeof FHIR_SMOKING_TEXT];
  }

  return SMOKING_VALUES.ANY;
};

export const fhirSmokingStatusTextToZK = (smokingText: string): number => {
  const lowerText = smokingText.toLowerCase();

  if (lowerText.includes("never")) {
    return SMOKING_VALUES.NEVER_SMOKED;
  }
  if (lowerText.includes("former")) {
    return SMOKING_VALUES.FORMER_SMOKER;
  }
  if (lowerText.includes("current")) {
    return SMOKING_VALUES.CURRENT_SMOKER;
  }
  return SMOKING_VALUES.ANY;
};

// ========================================
// DIABETES MAPPINGS (FHIR Condition)
// ========================================

/**
 * Maps FHIR diabetes condition codes to ZK circuit values
 * FHIR uses ICD-10 or SNOMED CT codes for diabetes
 */
export const fhirDiabetesToZK = (diabetesCode: string, conditionText?: string): number => {
  // Check ICD-10 codes first
  if (FHIR_DIABETES_ICD10[diabetesCode as keyof typeof FHIR_DIABETES_ICD10]) {
    return FHIR_DIABETES_ICD10[diabetesCode as keyof typeof FHIR_DIABETES_ICD10];
  }

  // Check SNOMED CT codes
  if (FHIR_DIABETES_SNOMED[diabetesCode as keyof typeof FHIR_DIABETES_SNOMED]) {
    return FHIR_DIABETES_SNOMED[diabetesCode as keyof typeof FHIR_DIABETES_SNOMED];
  }

  // Text-based mapping for condition descriptions
  if (conditionText) {
    const lowerText = conditionText.toLowerCase();

    if (
      lowerText.includes("type 1") ||
      lowerText.includes("type i") ||
      lowerText.includes("iddm") ||
      lowerText.includes("insulin dependent")
    ) {
      return DIABETES_VALUES.TYPE_1;
    }

    if (
      lowerText.includes("type 2") ||
      lowerText.includes("type ii") ||
      lowerText.includes("niddm") ||
      lowerText.includes("non-insulin dependent") ||
      lowerText.includes("gestational")
    ) {
      return DIABETES_VALUES.TYPE_2;
    }

    if (
      lowerText.includes("pre-diabetes") ||
      lowerText.includes("prediabetes") ||
      lowerText.includes("impaired glucose")
    ) {
      return DIABETES_VALUES.PRE_DIABETES;
    }
  }

  return DIABETES_VALUES.NO_DIABETES;
};

// ========================================
// HEART DISEASE MAPPINGS (FHIR Condition)
// ========================================

/**
 * Maps FHIR cardiovascular condition codes to ZK circuit values
 */
export const fhirHeartDiseaseToZK = (heartCode: string, conditionText?: string): number => {
  // Check ICD-10 codes first
  if (FHIR_HEART_DISEASE_ICD10[heartCode as keyof typeof FHIR_HEART_DISEASE_ICD10]) {
    return FHIR_HEART_DISEASE_ICD10[heartCode as keyof typeof FHIR_HEART_DISEASE_ICD10];
  }

  // Check SNOMED CT codes
  if (FHIR_HEART_DISEASE_SNOMED[heartCode as keyof typeof FHIR_HEART_DISEASE_SNOMED]) {
    return FHIR_HEART_DISEASE_SNOMED[heartCode as keyof typeof FHIR_HEART_DISEASE_SNOMED];
  }

  // Text-based mapping for condition descriptions
  if (conditionText) {
    const lowerText = conditionText.toLowerCase();

    if (
      lowerText.includes("heart attack") ||
      lowerText.includes("myocardial infarction") ||
      lowerText.includes("mi")
    ) {
      return HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK;
    }

    if (
      lowerText.includes("coronary") ||
      lowerText.includes("angina") ||
      lowerText.includes("heart failure") ||
      lowerText.includes("cardiomyopathy")
    ) {
      return HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION;
    }

    if (lowerText.includes("family history") || lowerText.includes("genetic risk")) {
      return HEART_DISEASE_VALUES.FAMILY_HISTORY;
    }

    if (
      lowerText.includes("current") ||
      lowerText.includes("active") ||
      lowerText.includes("ongoing")
    ) {
      return HEART_DISEASE_VALUES.CURRENT_CONDITION;
    }
  }

  return HEART_DISEASE_VALUES.NO_HISTORY;
};

// ========================================
// ACTIVITY LEVEL MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR physical activity observations to ZK circuit values
 * Based on LOINC codes for physical activity assessments
 */
export const fhirActivityLevelToZK = (activityCode: string, value?: number): number => {
  if (activityCode === "68516-4" && value !== undefined) {
    // Exercise minutes per week
    if (value < 30) return ACTIVITY_LEVEL_VALUES.SEDENTARY;
    if (value < 150) return ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE;
    if (value < 300) return ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE;
    if (value < 420) return ACTIVITY_LEVEL_VALUES.VERY_ACTIVE;
    return ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE;
  }

  if (activityCode === "89574-8" && value !== undefined) {
    // Steps per day
    if (value < 5000) return ACTIVITY_LEVEL_VALUES.SEDENTARY;
    if (value < 7500) return ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE;
    if (value < 10000) return ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE;
    if (value < 12500) return ACTIVITY_LEVEL_VALUES.VERY_ACTIVE;
    return ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE;
  }

  // Text-based activity level mapping
  if (activityCode) {
    const lowerCode = activityCode.toLowerCase();

    if (
      lowerCode.includes("sedentary") ||
      lowerCode.includes("inactive") ||
      lowerCode.includes("low")
    ) {
      return ACTIVITY_LEVEL_VALUES.SEDENTARY;
    }
    if (
      lowerCode.includes("light") ||
      lowerCode.includes("mild") ||
      lowerCode.includes("occasional")
    ) {
      return ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE;
    }
    if (
      lowerCode.includes("moderate") ||
      lowerCode.includes("regular") ||
      lowerCode.includes("average")
    ) {
      return ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE;
    }
    if (
      lowerCode.includes("high") ||
      lowerCode.includes("vigorous") ||
      lowerCode.includes("frequent")
    ) {
      return ACTIVITY_LEVEL_VALUES.VERY_ACTIVE;
    }
    if (
      lowerCode.includes("extreme") ||
      lowerCode.includes("intense") ||
      lowerCode.includes("athlete")
    ) {
      return ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE;
    }
  }

  return -1; 
};

export const fhirSnomedActivityLevelToZK = (snomedCode: string): number | undefined => {
  const mappedValue = FHIR_ACTIVITY_LEVEL_SNOMED[snomedCode as keyof typeof FHIR_ACTIVITY_LEVEL_SNOMED];
  return mappedValue;
};

export const fhirObservationToActivityZK = (
  loincCode?: string,
  snomedCode?: string,
  numericValue?: number
): number => {
  if (snomedCode) {
    const snomedMapped = fhirSnomedActivityLevelToZK(snomedCode);
    console.log("Mapping activity level SNOMED code:", snomedCode, "to ZK value:", snomedMapped);
    if (snomedMapped !== undefined) return snomedMapped;
  }

  if (loincCode && numericValue !== undefined) {
    return fhirActivityLevelToZK(loincCode, numericValue);
  }

  return -1;
};

// ========================================
// REGION/LOCATION MAPPINGS
// ========================================

/**
 * Maps FHIR country code to ZK circuit region value
 * Uses ISO country codes and regional groupings
 * @param country - ISO country code (e.g., "US", "CA", "FR")
 * @returns Array containing the region value, or empty array if country not found
 */
export const fhirCountryToZK = (country?: string): number[] => {
  if (!country) return [];

  const region = COUNTRY_TO_REGION[country.toUpperCase() as keyof typeof COUNTRY_TO_REGION];
  return region ? [region] : [];
};

/**
 * Main function to extract ZK-compatible values from FHIR resources
 */
export const convertToZkReady = (
  medicalData: AggregatedMedicalData
): ExtractedMedicalData => {
  const values: ExtractedMedicalData = {};

  values.age = medicalData.age?.value;
  values.gender = medicalData.sexAtBirth ? fhirGenderToZK(medicalData.sexAtBirth) : undefined;
  values.bmi = medicalData.bmi?.value;
  values.cholesterol = medicalData.cholesterol?.value;
  values.systolicBP = medicalData.systolicBP?.value;
  values.diastolicBP = medicalData.diastolicBP?.value;
  values.hba1c = medicalData.hba1c?.value;
  values.bloodType = medicalData.bloodType?.code ? fhirBloodTypeToZK(medicalData.bloodType.code) : undefined;
  values.smokingStatus = medicalData.smokingStatus?.code ? fhirSmokingStatusToZK(medicalData.smokingStatus.code) : undefined;
  values.regions = medicalData.country
    ? fhirCountryToZK(medicalData.country)
    : undefined;

  if(medicalData.activityLevel?.code)
  {
    switch(medicalData.activityLevel.codeSystem)
    {
      case "SNOMED":
        values.activityLevel = fhirSnomedActivityLevelToZK(medicalData.activityLevel.code);
        break;
      case "LOINC": {
        const numericValue = typeof medicalData.activityLevel.value === 'number' 
          ? medicalData.activityLevel.value 
          : undefined;
        values.activityLevel = fhirObservationToActivityZK(
          medicalData.activityLevel.code,
          undefined,
          numericValue,
        );
        break;
      }
      default:
        values.activityLevel = undefined;
    }
  }
  
  values.diabetesStatus = DIABETES_VALUES.NO_DIABETES;
  values.heartDiseaseStatus = HEART_DISEASE_VALUES.NO_HISTORY;
  
  return values;
};
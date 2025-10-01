/**
 * FHIR to ZK Circuit Mappings
 * This service maps FHIR standard values to numeric values used in ZK circuits
 *
 * FHIR Resources that contain medical criteria:
 * - Patient: demographics (gender, birthDate for age calculation)
 * - Observation: vitals, lab values (cholesterol, BMI, blood pressure, HbA1c, smoking status, activity)
 * - Condition: medical conditions (diabetes, heart disease)
 *
 * Uses centralized medical data constants for consistency across the application
 */

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
  REGION_VALUES,
} from "@/constants/medicalDataConstants";

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
  // Check SNOMED CT codes first
  if (FHIR_BLOOD_TYPE_SNOMED[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_SNOMED]) {
    return FHIR_BLOOD_TYPE_SNOMED[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_SNOMED];
  }

  // Check text representations
  if (FHIR_BLOOD_TYPE_TEXT[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_TEXT]) {
    return FHIR_BLOOD_TYPE_TEXT[fhirBloodType as keyof typeof FHIR_BLOOD_TYPE_TEXT];
  }

  return 0; // Unknown blood type
};

// ========================================
// SMOKING STATUS MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR smoking status codes to ZK circuit values
 * FHIR uses SNOMED CT codes for smoking status
 */
export const fhirSmokingStatusToZK = (smokingCode: string): number => {
  // Check SNOMED CT codes first
  if (FHIR_SMOKING_SNOMED[smokingCode as keyof typeof FHIR_SMOKING_SNOMED]) {
    return FHIR_SMOKING_SNOMED[smokingCode as keyof typeof FHIR_SMOKING_SNOMED];
  }

  // Check text representations
  const lowerCode = smokingCode.toLowerCase();
  if (FHIR_SMOKING_TEXT[lowerCode as keyof typeof FHIR_SMOKING_TEXT]) {
    return FHIR_SMOKING_TEXT[lowerCode as keyof typeof FHIR_SMOKING_TEXT];
  }

  return SMOKING_VALUES.ANY; // Default to 'any' if unknown
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
  // LOINC codes for physical activity with value-based mapping
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

  return ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE; // Default to moderate activity
};

// ========================================
// REGION/LOCATION MAPPINGS
// ========================================

/**
 * Maps FHIR address/location data to ZK circuit region values
 * Uses ISO country codes and regional groupings
 */
export const fhirLocationToZK = (country?: string, continent?: string, address?: any): number[] => {
  const regions: number[] = [];

  if (country) {
    const region = COUNTRY_TO_REGION[country.toUpperCase() as keyof typeof COUNTRY_TO_REGION];
    if (region) regions.push(region);
  }

  // Parse FHIR Address resource if provided
  if (address?.country) {
    const region =
      COUNTRY_TO_REGION[address.country.toUpperCase() as keyof typeof COUNTRY_TO_REGION];
    if (region && !regions.includes(region)) regions.push(region);
  }

  return regions.length > 0 ? regions : [REGION_VALUES.NORTH_AMERICA]; // Default to North America
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate age from FHIR Patient.birthDate
 */
export const calculateAgeFromFHIR = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  return age;
};

/**
 * Extract numeric value from FHIR Observation
 */
export const extractObservationValue = (
  observation: any
): { value: number; unit: string } | null => {
  if (observation.valueQuantity) {
    return {
      value: observation.valueQuantity.value,
      unit: observation.valueQuantity.unit || observation.valueQuantity.code || "",
    };
  }

  if (observation.valueInteger !== undefined) {
    return { value: observation.valueInteger, unit: "" };
  }

  if (observation.valueDecimal !== undefined) {
    return { value: observation.valueDecimal, unit: "" };
  }

  return null;
};

/**
 * Main function to extract ZK-compatible values from FHIR resources
 */
export const extractZKValuesFromFHIR = (
  fhirResource: any
): Partial<{
  age: number;
  gender: number;
  bloodType: number;
  smokingStatus: number;
  activityLevel: number;
  diabetesStatus: number;
  heartDiseaseStatus: number;
  regions: number[];
  cholesterol: number;
  bmi: number;
  systolicBP: number;
  diastolicBP: number;
  hba1c: number;
}> => {
  const values: any = {};

  // Handle Patient resource
  if (fhirResource.resourceType === "Patient") {
    if (fhirResource.birthDate) {
      values.age = calculateAgeFromFHIR(fhirResource.birthDate);
    }
    if (fhirResource.gender) {
      values.gender = fhirGenderToZK(fhirResource.gender);
    }
    if (fhirResource.address) {
      values.regions = fhirLocationToZK(
        fhirResource.address[0]?.country,
        undefined,
        fhirResource.address[0]
      );
    }
  }

  // Handle Observation resource
  if (fhirResource.resourceType === "Observation") {
    const code = fhirResource.code?.coding?.[0]?.code;
    const obsValue = extractObservationValue(fhirResource);

    if (code && obsValue) {
      // Map common LOINC codes to our criteria
      switch (code) {
        case "2085-9": // Cholesterol, HDL
        case "2089-1": // Cholesterol, LDL
        case "14647-2": // Cholesterol, total
          values.cholesterol = obsValue.value;
          break;
        case "39156-5": // BMI
          values.bmi = obsValue.value;
          break;
        case "8480-6": // Systolic BP
          values.systolicBP = obsValue.value;
          break;
        case "8462-4": // Diastolic BP
          values.diastolicBP = obsValue.value;
          break;
        case "4548-4": // HbA1c
        case "17856-6": // HbA1c (IFCC)
          values.hba1c = obsValue.value;
          break;
        case "72166-2": // Tobacco smoking status
          values.smokingStatus = fhirSmokingStatusToZK(
            fhirResource.valueCodeableConcept?.coding?.[0]?.code || ""
          );
          break;
      }
    }
  }

  // Handle Condition resource
  if (fhirResource.resourceType === "Condition") {
    const code = fhirResource.code?.coding?.[0]?.code;
    const text = fhirResource.code?.text || fhirResource.code?.coding?.[0]?.display;

    if (code) {
      // Check for diabetes codes
      const diabetesResult = fhirDiabetesToZK(code, text);
      if (diabetesResult > 0) {
        values.diabetesStatus = diabetesResult;
      }

      // Check for heart disease codes
      const heartResult = fhirHeartDiseaseToZK(code, text);
      if (heartResult > 0) {
        values.heartDiseaseStatus = heartResult;
      }
    }
  }

  return values;
};

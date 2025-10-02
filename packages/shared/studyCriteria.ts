/**
 * Shared library for study criteria types and templates
 * Used across: Smart contracts, API, Frontend, Scripts
 */

// ========================================
// CORE TYPES
// ========================================

export interface StudyCriteria {
  enableAge: number;
  minAge: number;
  maxAge: number;
  enableCholesterol: number;
  minCholesterol: number;
  maxCholesterol: number;
  enableBMI: number;
  minBMI: number;
  maxBMI: number;
  enableBloodType: number;
  allowedBloodTypes: readonly [number, number, number, number];
  enableGender: number;
  allowedGender: number;
  enableLocation: number;
  allowedRegions: readonly [number, number, number, number];
  enableBloodPressure: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  enableHbA1c: number;
  minHbA1c: number;
  maxHbA1c: number;
  enableSmoking: number;
  allowedSmoking: number;
  enableActivity: number;
  minActivityLevel: number;
  maxActivityLevel: number;
  enableDiabetes: number;
  allowedDiabetes: number;
  enableHeartDisease: number;
  allowedHeartDisease: number;
}

// ========================================
// DEFAULT TEMPLATE
// ========================================

export const DEFAULT_CRITERIA: StudyCriteria = {
  enableAge: 0,
  minAge: 0,
  maxAge: 0,
  enableCholesterol: 0,
  minCholesterol: 0,
  maxCholesterol: 0,
  enableBMI: 0,
  minBMI: 0,
  maxBMI: 0,
  enableBloodType: 0,
  allowedBloodTypes: [0, 0, 0, 0] as const,
  enableGender: 0,
  allowedGender: 0,
  enableLocation: 0,
  allowedRegions: [0, 0, 0, 0] as const,
  enableBloodPressure: 0,
  minSystolic: 0,
  maxSystolic: 0,
  minDiastolic: 0,
  maxDiastolic: 0,
  enableHbA1c: 0,
  minHbA1c: 0,
  maxHbA1c: 0,
  enableSmoking: 0,
  allowedSmoking: 0,
  enableActivity: 0,
  minActivityLevel: 0,
  maxActivityLevel: 0,
  enableDiabetes: 0,
  allowedDiabetes: 0,
  enableHeartDisease: 0,
  allowedHeartDisease: 0,
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Create study criteria with defaults - only specify what you want to enable!
 */
export function createCriteria(overrides: Partial<StudyCriteria> = {}): StudyCriteria {
  return { ...DEFAULT_CRITERIA, ...overrides };
}

/**
 * Validate study criteria - ensure ranges are valid
 */
export function validateCriteria(criteria: StudyCriteria): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate age range if enabled
  if (criteria.enableAge && criteria.minAge >= criteria.maxAge) {
    errors.push("Age: minAge must be less than maxAge");
  }

  // Validate cholesterol range if enabled
  if (criteria.enableCholesterol && criteria.minCholesterol >= criteria.maxCholesterol) {
    errors.push("Cholesterol: minCholesterol must be less than maxCholesterol");
  }

  // Validate BMI range if enabled
  if (criteria.enableBMI && criteria.minBMI >= criteria.maxBMI) {
    errors.push("BMI: minBMI must be less than maxBMI");
  }

  // Validate blood pressure ranges if enabled
  if (criteria.enableBloodPressure) {
    if (criteria.minSystolic >= criteria.maxSystolic) {
      errors.push("Blood Pressure: minSystolic must be less than maxSystolic");
    }
    if (criteria.minDiastolic >= criteria.maxDiastolic) {
      errors.push("Blood Pressure: minDiastolic must be less than maxDiastolic");
    }
  }

  // Validate HbA1c range if enabled
  if (criteria.enableHbA1c && criteria.minHbA1c >= criteria.maxHbA1c) {
    errors.push("HbA1c: minHbA1c must be less than maxHbA1c");
  }

  // Validate activity range if enabled
  if (criteria.enableActivity && criteria.minActivityLevel >= criteria.maxActivityLevel) {
    errors.push("Activity: minActivityLevel must be less than maxActivityLevel");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Count enabled criteria in a study
 */
export function countEnabledCriteria(criteria: StudyCriteria): number {
  return [
    criteria.enableAge,
    criteria.enableCholesterol,
    criteria.enableBMI,
    criteria.enableBloodType,
    criteria.enableGender,
    criteria.enableLocation,
    criteria.enableBloodPressure,
    criteria.enableHbA1c,
    criteria.enableSmoking,
    criteria.enableActivity,
    criteria.enableDiabetes,
    criteria.enableHeartDisease,
  ].filter((enabled) => enabled === 1).length;
}

/**
 * Get study complexity level
 */
export function getStudyComplexity(
  criteria: StudyCriteria
): "open" | "simple" | "moderate" | "comprehensive" {
  const count = countEnabledCriteria(criteria);
  if (count === 0) return "open";
  if (count <= 2) return "simple";
  if (count <= 5) return "moderate";
  return "comprehensive";
}

// ========================================
// PRE-BUILT TEMPLATES
// ========================================

export const STUDY_TEMPLATES = {
  // No restrictions - anyone can join
  OPEN: createCriteria(),

  // Basic demographics
  AGE_ONLY: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
  }),

  ADULTS_ONLY: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 99,
  }),

  // Gender-specific studies
  WOMEN_18_TO_55: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 55,
    enableGender: 1,
    allowedGender: 2, // Female
  }),

  MEN_25_TO_65: createCriteria({
    enableAge: 1,
    minAge: 25,
    maxAge: 65,
    enableGender: 1,
    allowedGender: 1, // Male
  }),

  // Health-focused studies
  HEALTHY_BMI: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
    enableBMI: 1,
    minBMI: 185, // BMI 18.5
    maxBMI: 250, // BMI 25.0
  }),

  CARDIAC_RESEARCH: createCriteria({
    enableAge: 1,
    minAge: 40,
    maxAge: 80,
    enableBloodPressure: 1,
    minSystolic: 120,
    maxSystolic: 180,
    minDiastolic: 80,
    maxDiastolic: 110,
    enableSmoking: 1,
    allowedSmoking: 3, // Any smoking status
    enableHeartDisease: 1,
    allowedHeartDisease: 2, // Any history allowed
  }),

  DIABETES_RESEARCH: createCriteria({
    enableAge: 1,
    minAge: 30,
    maxAge: 70,
    enableBMI: 1,
    minBMI: 200, // BMI 20.0
    maxBMI: 400, // BMI 40.0
    enableHbA1c: 1,
    minHbA1c: 65, // 6.5%
    maxHbA1c: 120, // 12.0%
    enableDiabetes: 1,
    allowedDiabetes: 3, // Any diabetes type
  }),

  HYPERTENSION_STUDY: createCriteria({
    enableAge: 1,
    minAge: 25,
    maxAge: 75,
    enableBloodPressure: 1,
    minSystolic: 140, // Hypertensive range
    maxSystolic: 200,
    minDiastolic: 90,
    maxDiastolic: 120,
    enableBMI: 1,
    minBMI: 180, // BMI 18.0
    maxBMI: 400, // BMI 40.0
  }),
} as const;

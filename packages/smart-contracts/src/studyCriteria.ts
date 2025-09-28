/**
 * Shared study criteria types and utilities
 * Moved to packages/smart-contracts/src for easier imports
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

  if (criteria.enableAge && criteria.minAge >= criteria.maxAge) {
    errors.push("Age: minAge must be less than maxAge");
  }
  if (criteria.enableCholesterol && criteria.minCholesterol >= criteria.maxCholesterol) {
    errors.push("Cholesterol: minCholesterol must be less than maxCholesterol");
  }
  if (criteria.enableBMI && criteria.minBMI >= criteria.maxBMI) {
    errors.push("BMI: minBMI must be less than maxBMI");
  }
  if (criteria.enableBloodPressure) {
    if (criteria.minSystolic >= criteria.maxSystolic) {
      errors.push("Blood Pressure: minSystolic must be less than maxSystolic");
    }
    if (criteria.minDiastolic >= criteria.maxDiastolic) {
      errors.push("Blood Pressure: minDiastolic must be less than maxDiastolic");
    }
  }
  if (criteria.enableHbA1c && criteria.minHbA1c >= criteria.maxHbA1c) {
    errors.push("HbA1c: minHbA1c must be less than maxHbA1c");
  }
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
  OPEN: createCriteria(),
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
  WOMEN_18_TO_55: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 55,
    enableGender: 1,
    allowedGender: 2,
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
    allowedSmoking: 3,
    enableHeartDisease: 1,
    allowedHeartDisease: 2,
  }),
  DIABETES_RESEARCH: createCriteria({
    enableAge: 1,
    minAge: 30,
    maxAge: 70,
    enableBMI: 1,
    minBMI: 200,
    maxBMI: 400,
    enableHbA1c: 1,
    minHbA1c: 65,
    maxHbA1c: 120,
    enableDiabetes: 1,
    allowedDiabetes: 3,
  }),
} as const;

/**
 * Convert criteria to blockchain format (BigInt conversion)
 */
export function toBlockchainFormat(criteria: StudyCriteria) {
  return {
    enableAge: BigInt(criteria.enableAge),
    minAge: BigInt(criteria.minAge),
    maxAge: BigInt(criteria.maxAge),
    enableCholesterol: BigInt(criteria.enableCholesterol),
    minCholesterol: BigInt(criteria.minCholesterol),
    maxCholesterol: BigInt(criteria.maxCholesterol),
    enableBMI: BigInt(criteria.enableBMI),
    minBMI: BigInt(criteria.minBMI),
    maxBMI: BigInt(criteria.maxBMI),
    enableBloodType: BigInt(criteria.enableBloodType),
    allowedBloodTypes: [
      BigInt(criteria.allowedBloodTypes[0]),
      BigInt(criteria.allowedBloodTypes[1]),
      BigInt(criteria.allowedBloodTypes[2]),
      BigInt(criteria.allowedBloodTypes[3]),
    ] as const,
    enableGender: BigInt(criteria.enableGender),
    allowedGender: BigInt(criteria.allowedGender),
    enableLocation: BigInt(criteria.enableLocation),
    allowedRegions: [
      BigInt(criteria.allowedRegions[0]),
      BigInt(criteria.allowedRegions[1]),
      BigInt(criteria.allowedRegions[2]),
      BigInt(criteria.allowedRegions[3]),
    ] as const,
    enableBloodPressure: BigInt(criteria.enableBloodPressure),
    minSystolic: BigInt(criteria.minSystolic),
    maxSystolic: BigInt(criteria.maxSystolic),
    minDiastolic: BigInt(criteria.minDiastolic),
    maxDiastolic: BigInt(criteria.maxDiastolic),
    enableHbA1c: BigInt(criteria.enableHbA1c),
    minHbA1c: BigInt(criteria.minHbA1c),
    maxHbA1c: BigInt(criteria.maxHbA1c),
    enableSmoking: BigInt(criteria.enableSmoking),
    allowedSmoking: BigInt(criteria.allowedSmoking),
    enableActivity: BigInt(criteria.enableActivity),
    minActivityLevel: BigInt(criteria.minActivityLevel),
    maxActivityLevel: BigInt(criteria.maxActivityLevel),
    enableDiabetes: BigInt(criteria.enableDiabetes),
    allowedDiabetes: BigInt(criteria.allowedDiabetes),
    enableHeartDisease: BigInt(criteria.enableHeartDisease),
    allowedHeartDisease: BigInt(criteria.allowedHeartDisease),
  };
}

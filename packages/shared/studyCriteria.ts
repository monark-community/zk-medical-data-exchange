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
// DEFAULT VALUES FOR FORM INPUTS
// ========================================

export const CRITERIA_DEFAULTS = {
  maxParticipants: 10000,
  durationDays: 365,

  age: {
    min: 0,
    max: 150,
    step: 1,
  },

  bmi: {
    min: 10.0,
    max: 80.0,
    step: 0.1,
  },

  cholesterol: {
    min: 0,
    max: 1000,
    step: 0.1,
  },

  bloodPressure: {
    systolic: {
      min: 70,
      max: 250,
      step: 0.1,
    },
    diastolic: {
      min: 40,
      max: 150,
      step: 0.1,
    },
  },

  hbA1c: {
    min: 4.0,
    max: 20.0,
    step: 0.1,
  },

  activityLevel: {
    min: 1, // Sedentary
    max: 3, // Moderately Active
  },
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

export function createCriteria(overrides: Partial<StudyCriteria> = {}): StudyCriteria {
  return { ...DEFAULT_CRITERIA, ...overrides };
}

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
    const effectiveMinSystolic =
      criteria.minSystolic === 0
        ? CRITERIA_DEFAULTS.bloodPressure.systolic.min
        : criteria.minSystolic / 10;
    const effectiveMaxSystolic =
      criteria.maxSystolic === 0
        ? CRITERIA_DEFAULTS.bloodPressure.systolic.max
        : criteria.maxSystolic / 10;
    const effectiveMinDiastolic =
      criteria.minDiastolic === 0
        ? CRITERIA_DEFAULTS.bloodPressure.diastolic.min
        : criteria.minDiastolic / 10;
    const effectiveMaxDiastolic =
      criteria.maxDiastolic === 0
        ? CRITERIA_DEFAULTS.bloodPressure.diastolic.max
        : criteria.maxDiastolic / 10;

    if (effectiveMinSystolic >= effectiveMaxSystolic) {
      errors.push("Blood Pressure: minSystolic must be less than maxSystolic");
    }
    if (effectiveMinDiastolic >= effectiveMaxDiastolic) {
      errors.push("Blood Pressure: minDiastolic must be less than maxDiastolic");
    }
  }

  if (criteria.enableHbA1c && criteria.minHbA1c >= criteria.maxHbA1c) {
    errors.push("HbA1c: minHbA1c must be less than maxHbA1c");
  }

  if (criteria.enableActivity && criteria.minActivityLevel >= criteria.maxActivityLevel) {
    errors.push("Activity: minActivityLevel must be less than maxActivityLevel");
  }

  if (criteria.enableLocation && criteria.allowedRegions.every((r) => r === 0)) {
    errors.push("Location criteria is enabled but no regions are selected.");
  }

  if (criteria.enableBloodType && criteria.allowedBloodTypes.every((r) => r === 0)) {
    errors.push("Blood type criteria is enabled but no blood types are selected.");
  }

  return { valid: errors.length === 0, errors };
}

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

  MEN_25_TO_65: createCriteria({
    enableAge: 1,
    minAge: 25,
    maxAge: 65,
    enableGender: 1,
    allowedGender: 1,
  }),

  HEALTHY_BMI: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
    enableBMI: 1,
    minBMI: 185,
    maxBMI: 250,
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

  HYPERTENSION_STUDY: createCriteria({
    enableAge: 1,
    minAge: 25,
    maxAge: 75,
    enableBloodPressure: 1,
    minSystolic: 140,
    maxSystolic: 200,
    minDiastolic: 90,
    maxDiastolic: 120,
    enableBMI: 1,
    minBMI: 180,
    maxBMI: 400,
  }),
} as const;

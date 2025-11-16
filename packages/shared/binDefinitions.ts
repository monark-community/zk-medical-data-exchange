/**
 * Shared library for study-specific bin generation
 * Used for privacy-preserving data aggregation with ZK proofs
 * 
 * STRATEGY: Hybrid Binning Approach
 * - Age/BMI: Equal-width bins (predictable, simple)
 * - Cholesterol/HbA1c/BP: Clinical thresholds (medically meaningful)
 * - Categorical: No binning needed (use existing categories)
 */

import { StudyCriteria } from './studyCriteria.js';

// ========================================
// TYPES
// ========================================

export interface BinDefinition {
  enabled: boolean;
  boundaries: number[];      // Boundary values (e.g., [20, 30, 40, 50, 60])
  binCount: number;          // Number of bins (boundaries.length - 1)
  labels: string[];          // Human-readable labels (e.g., ["20-30", "30-40"])
  type: 'equal-width' | 'clinical' | 'categorical';
}

export interface StudyBins {
  age?: BinDefinition;
  cholesterol?: BinDefinition;
  bmi?: BinDefinition;
  hba1c?: BinDefinition;
  bloodPressure?: BinDefinition;
  // Categorical fields don't need bins (gender, smoking, etc.)
}

export interface BinGenerationConfig {
  minParticipantsPerBin: number;  // k-anonymity threshold (default: 5)
  expectedParticipants: number;    // Used to determine bin count
}

// ========================================
// CLINICAL THRESHOLDS (Medical Standards)
// ========================================

export const CLINICAL_THRESHOLDS = {
  // Cholesterol (mg/dL) - American Heart Association guidelines
  cholesterol: {
    boundaries: [200, 240],  // <200 (desirable), 200-240 (borderline), >240 (high)
    labels: ['<200 (Desirable)', '200-240 (Borderline)', '>240 (High)']
  },
  
  // HbA1c (%) - American Diabetes Association guidelines
  // Note: Stored as HbA1c * 10 in circuit (e.g., 5.7% = 57)
  hba1c: {
    boundaries: [57, 65],  // <5.7% (normal), 5.7-6.4% (prediabetic), >=6.5% (diabetic)
    labels: ['<5.7% (Normal)', '5.7-6.4% (Prediabetic)', '≥6.5% (Diabetic)']
  },
  
  // Blood Pressure - American Heart Association guidelines
  // Categories: normal, elevated, high
  bloodPressure: {
    systolic: {
      boundaries: [120, 130],  // <120 (normal), 120-129 (elevated), >=130 (high)
      labels: ['<120 (Normal)', '120-129 (Elevated)', '≥130 (High)']
    },
    diastolic: {
      boundaries: [80],  // <80 (normal), >=80 (high)
      labels: ['<80 (Normal)', '≥80 (High)']
    }
  },
  
  // BMI - WHO classification
  // Note: Stored as BMI * 10 in circuit (e.g., 18.5 = 185)
  bmi: {
    boundaries: [185, 250, 300],  // <18.5 (underweight), 18.5-24.9 (normal), 25-29.9 (overweight), >=30 (obese)
    labels: ['<18.5 (Underweight)', '18.5-24.9 (Normal)', '25-29.9 (Overweight)', '≥30 (Obese)']
  }
} as const;

// ========================================
// BIN GENERATION FUNCTIONS
// ========================================

/**
 * Determine optimal bin count based on expected participants
 * Ensures k-anonymity (minimum participants per bin)
 */
export function calculateOptimalBinCount(
  expectedParticipants: number,
  minPerBin: number = 5
): number {
  // Target: each bin should have at least minPerBin participants
  const maxBins = Math.floor(expectedParticipants / minPerBin);
  
  // Clamp between 3-5 bins for usability
  if (maxBins < 3) return 3;
  if (maxBins > 5) return 5;
  return maxBins;
}

/**
 * Generate equal-width bins for continuous variables
 */
export function createEqualWidthBins(
  min: number,
  max: number,
  binCount: number
): { boundaries: number[]; labels: string[] } {
  if (min >= max) {
    throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
  }
  
  const width = (max - min) / binCount;
  const boundaries: number[] = [];
  const labels: string[] = [];
  
  for (let i = 0; i <= binCount; i++) {
    boundaries.push(Math.round(min + i * width));
  }
  
  // Generate labels
  for (let i = 0; i < binCount; i++) {
    labels.push(`${boundaries[i]}-${boundaries[i + 1]}`);
  }
  
  return { boundaries, labels };
}

/**
 * Generate clinical threshold bins (use predefined medical categories)
 */
export function createClinicalBins(
  min: number,
  max: number,
  clinicalThresholds: { boundaries: readonly number[]; labels: readonly string[] }
): { boundaries: number[]; labels: string[] } {
  // Filter thresholds that fall within the study's range
  const relevantBoundaries: number[] = [];
  const relevantLabels: string[] = [];
  
  // Add min as first boundary
  relevantBoundaries.push(min);
  
  // Add clinical thresholds that fall within range
  clinicalThresholds.boundaries.forEach((threshold, idx) => {
    if (threshold > min && threshold < max) {
      relevantBoundaries.push(threshold);
    }
  });
  
  // Add max as last boundary
  relevantBoundaries.push(max);
  
  // Generate labels based on clinical categories
  for (let i = 0; i < relevantBoundaries.length - 1; i++) {
    const lower = relevantBoundaries[i];
    const upper = relevantBoundaries[i + 1];
    
    // Try to find matching clinical label
    let label = `${lower}-${upper}`;
    for (let j = 0; j < clinicalThresholds.boundaries.length + 1; j++) {
      const clinicalLower = j === 0 ? 0 : clinicalThresholds.boundaries[j - 1];
      const clinicalUpper = j === clinicalThresholds.boundaries.length 
        ? Infinity 
        : clinicalThresholds.boundaries[j];
      
      // Check if this bin roughly matches a clinical category
      if (lower >= clinicalLower - 5 && upper <= clinicalUpper + 5) {
        label = clinicalThresholds.labels[j] || label;
        break;
      }
    }
    
    relevantLabels.push(label);
  }
  
  return { boundaries: relevantBoundaries, labels: relevantLabels };
}

/**
 * MAIN FUNCTION: Generate all bins for a study
 */
export function generateStudyBins(
  criteria: StudyCriteria,
  config: BinGenerationConfig
): StudyBins {
  const bins: StudyBins = {};
  const binCount = calculateOptimalBinCount(
    config.expectedParticipants,
    config.minParticipantsPerBin
  );
  
  // AGE: Equal-width bins
  if (criteria.enableAge === 1) {
    const { boundaries, labels } = createEqualWidthBins(
      criteria.minAge,
      criteria.maxAge,
      binCount
    );
    bins.age = {
      enabled: true,
      boundaries,
      binCount: boundaries.length - 1,
      labels,
      type: 'equal-width'
    };
  }
  
  // CHOLESTEROL: Clinical threshold bins
  if (criteria.enableCholesterol === 1) {
    const { boundaries, labels } = createClinicalBins(
      criteria.minCholesterol,
      criteria.maxCholesterol,
      CLINICAL_THRESHOLDS.cholesterol
    );
    bins.cholesterol = {
      enabled: true,
      boundaries,
      binCount: boundaries.length - 1,
      labels,
      type: 'clinical'
    };
  }
  
  // BMI: Clinical threshold bins (WHO categories)
  if (criteria.enableBMI === 1) {
    const { boundaries, labels } = createClinicalBins(
      criteria.minBMI,
      criteria.maxBMI,
      CLINICAL_THRESHOLDS.bmi
    );
    bins.bmi = {
      enabled: true,
      boundaries,
      binCount: boundaries.length - 1,
      labels,
      type: 'clinical'
    };
  }
  
  // HbA1c: Clinical threshold bins (ADA guidelines)
  if (criteria.enableHbA1c === 1) {
    const { boundaries, labels } = createClinicalBins(
      criteria.minHbA1c,
      criteria.maxHbA1c,
      CLINICAL_THRESHOLDS.hba1c
    );
    bins.hba1c = {
      enabled: true,
      boundaries,
      binCount: boundaries.length - 1,
      labels,
      type: 'clinical'
    };
  }
  
  // BLOOD PRESSURE: Clinical categories (combined systolic/diastolic)
  if (criteria.enableBloodPressure === 1) {
    // Use fixed 3-category system for BP (normal, elevated, high)
    bins.bloodPressure = {
      enabled: true,
      boundaries: [0, 1, 2],  // Category indices (not actual BP values)
      binCount: 3,
      labels: ['Normal', 'Elevated', 'High'],
      type: 'clinical'
    };
  }
  
  return bins;
}

// ========================================
// BIN VALIDATION
// ========================================

/**
 * Validate that bins meet k-anonymity requirements
 */
export function validateBins(
  bins: StudyBins,
  expectedParticipants: number,
  minPerBin: number = 5
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  Object.entries(bins).forEach(([field, binDef]) => {
    if (!binDef) return;
    
    const avgPerBin = expectedParticipants / binDef.binCount;
    if (avgPerBin < minPerBin) {
      warnings.push(
        `${field}: Average ${avgPerBin.toFixed(1)} participants per bin ` +
        `(target: ≥${minPerBin} for k-anonymity). Consider reducing bin count.`
      );
    }
  });
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

// ========================================
// CLIENT-SIDE BIN CALCULATION
// ========================================

/**
 * Calculate which bin a value falls into
 * Used by client before generating ZK proof
 */
export function calculateBinIndex(value: number, boundaries: number[]): number {
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (value >= boundaries[i] && value < boundaries[i + 1]) {
      return i;
    }
  }
  // If value >= last boundary, it goes in the last bin
  return boundaries.length - 2;
}

/**
 * Calculate bin indices for all user data
 */
export function calculateUserBins(
  userData: {
    age?: number;
    cholesterol?: number;
    bmi?: number;
    hba1c?: number;
    systolicBP?: number;
    diastolicBP?: number;
  },
  studyBins: StudyBins
): {
  ageBin?: number;
  cholesterolBin?: number;
  bmiBin?: number;
  hba1cBin?: number;
  bpBin?: number;
} {
  const result: any = {};
  
  if (studyBins.age && userData.age !== undefined) {
    result.ageBin = calculateBinIndex(userData.age, studyBins.age.boundaries);
  }
  
  if (studyBins.cholesterol && userData.cholesterol !== undefined) {
    result.cholesterolBin = calculateBinIndex(
      userData.cholesterol,
      studyBins.cholesterol.boundaries
    );
  }
  
  if (studyBins.bmi && userData.bmi !== undefined) {
    result.bmiBin = calculateBinIndex(userData.bmi, studyBins.bmi.boundaries);
  }
  
  if (studyBins.hba1c && userData.hba1c !== undefined) {
    result.hba1cBin = calculateBinIndex(userData.hba1c, studyBins.hba1c.boundaries);
  }
  
  // BP is categorical, calculated from systolic/diastolic
  if (studyBins.bloodPressure && userData.systolicBP && userData.diastolicBP) {
    result.bpBin = calculateBPCategory(userData.systolicBP, userData.diastolicBP);
  }
  
  return result;
}

/**
 * Calculate BP category (matches circuit logic)
 */
function calculateBPCategory(systolic: number, diastolic: number): number {
  // Normal: systolic < 120 AND diastolic < 80
  if (systolic < 120 && diastolic < 80) return 0;
  
  // Elevated: systolic 120-129 AND diastolic < 80
  if (systolic >= 120 && systolic < 130 && diastolic < 80) return 1;
  
  // High: systolic >= 130 OR diastolic >= 80
  return 2;
}

// ========================================
// EXPORT HELPERS
// ========================================

/**
 * Format bins for smart contract storage
 * Converts to fixed-length arrays for Solidity
 */
export function formatBinsForContract(bins: StudyBins): {
  ageBoundaries: number[];
  cholesterolBoundaries: number[];
  bmiBoundaries: number[];
  hba1cBoundaries: number[];
} {
  const MAX_BOUNDARIES = 10;  // Reasonable max for Solidity array
  
  const padBoundaries = (boundaries: number[] = []) => {
    const padded = [...boundaries];
    while (padded.length < MAX_BOUNDARIES) {
      padded.push(0);
    }
    return padded.slice(0, MAX_BOUNDARIES);
  };
  
  return {
    ageBoundaries: padBoundaries(bins.age?.boundaries),
    cholesterolBoundaries: padBoundaries(bins.cholesterol?.boundaries),
    bmiBoundaries: padBoundaries(bins.bmi?.boundaries),
    hba1cBoundaries: padBoundaries(bins.hba1c?.boundaries)
  };
}

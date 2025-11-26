import { BINNABLE_FIELDS, BinnableField } from "../dataBins";

/**
 * Calculate scale factor from decimal places
 * decimalPlaces = 0 -> factor = 1 (no scaling)
 * decimalPlaces = 1 -> factor = 10
 * decimalPlaces = 2 -> factor = 100
 */
function calculateScaleFactor(decimalPlaces: number): number {
  return Math.pow(10, decimalPlaces);
}

/**
 * Get scale factor for a specific field
 */
export function getScaleFactorForField(field: BinnableField): number {
  const metadata = BINNABLE_FIELDS[field];
  return calculateScaleFactor(metadata.decimalPlaces ?? 0);
}

/**
 * Dynamic scale factors based on decimal places configuration
 * This ensures that if decimalPlaces change, scale factors automatically update
 */
export const SCALE_FACTORS = {
  get minBMI() { return getScaleFactorForField(BinnableField.BMI); },
  get maxBMI() { return getScaleFactorForField(BinnableField.BMI); },
  get minHbA1c() { return getScaleFactorForField(BinnableField.HBA1C); },
  get maxHbA1c() { return getScaleFactorForField(BinnableField.HBA1C); },
  get minCholesterol() { return getScaleFactorForField(BinnableField.CHOLESTEROL); },
  get maxCholesterol() { return getScaleFactorForField(BinnableField.CHOLESTEROL); },
  get minSystolic() { return getScaleFactorForField(BinnableField.SYSTOLIC_BP); },
  get maxSystolic() { return getScaleFactorForField(BinnableField.SYSTOLIC_BP); },
  get minDiastolic() { return getScaleFactorForField(BinnableField.DIASTOLIC_BP); },
  get maxDiastolic() { return getScaleFactorForField(BinnableField.DIASTOLIC_BP); },
};

/**
 * Get scale factor for medical data field
 */
export function getScaleFactorForMedicalDataField(field: string): number {
  const fieldMap: Record<string, BinnableField> = {
    bmi: BinnableField.BMI,
    hba1c: BinnableField.HBA1C,
    cholesterol: BinnableField.CHOLESTEROL,
    systolicBP: BinnableField.SYSTOLIC_BP,
    diastolicBP: BinnableField.DIASTOLIC_BP,
  };
  
  const binnableField = fieldMap[field];
  if (!binnableField) {
    return 1; 
  }
  
  return getScaleFactorForField(binnableField);
}
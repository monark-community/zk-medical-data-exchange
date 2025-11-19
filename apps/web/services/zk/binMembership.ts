import type { BinConfiguration, DataBin } from "@zk-medical/shared";
import { BinType as BinTypeEnum } from "@zk-medical/shared";
import type { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

export interface BinMembershipResult {
  binIds: string[]; // List of string bin IDs (e.g., "age_bin_0") for display
  numericBinIds: number[]; // List of numeric bin IDs (e.g., 0, 1, 2) for blockchain
  binIndices: number[]; // Indices in the bins array (for circuit input)
  binCount: number; // Total number of bins matched
  fieldCoverage: Record<string, boolean>; // Which fields have bin assignments
}

export function computeParticipantBins(
  userData: ExtractedMedicalData,
  binConfig: BinConfiguration
): BinMembershipResult {
  const binIds: string[] = [];
  const numericBinIds: number[] = [];
  const binIndices: number[] = [];
  const fieldCoverage: Record<string, boolean> = {};

  binConfig.bins.forEach((bin, index) => {
    const belongs = checkBinMembership(userData, bin);
    
    if (belongs) {
      binIds.push(bin.id);
      numericBinIds.push(bin.numericId);
      binIndices.push(index);
      fieldCoverage[bin.criteriaField] = true;
    }
  });

  return {
    binIds,
    numericBinIds,
    binIndices,
    binCount: binIds.length,
    fieldCoverage,
  };
}

export function checkBinMembership(userData: ExtractedMedicalData, bin: DataBin): boolean {
  const fieldValue = getFieldValue(userData, bin.criteriaField);
  
  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  if (bin.type === BinTypeEnum.RANGE) {
    return checkRangeBin(fieldValue, bin);
  } else if (bin.type === BinTypeEnum.CATEGORICAL) {
    return checkCategoricalBin(fieldValue, bin);
  }

  return false;
}

function checkRangeBin(value: number, bin: DataBin): boolean {
  if (bin.minValue === undefined || bin.maxValue === undefined) {
    return false;
  }

  const includeMin = bin.includeMin !== undefined ? bin.includeMin : true;
  const includeMax = bin.includeMax !== undefined ? bin.includeMax : false;

  const meetsMin = includeMin ? value >= bin.minValue : value > bin.minValue;
  const meetsMax = includeMax ? value <= bin.maxValue : value < bin.maxValue;

  return meetsMin && meetsMax;
}

function checkCategoricalBin(value: number, bin: DataBin): boolean {
  if (!bin.categories || bin.categories.length === 0) {
    return false;
  }

  return bin.categories.includes(value);
}

function getFieldValue(userData: ExtractedMedicalData, fieldName: string): number | undefined {
  const fieldMap: Record<string, keyof ExtractedMedicalData> = {
    age: "age",
    gender: "gender",
    cholesterol: "cholesterol",
    bmi: "bmi",
    systolicBP: "systolicBP",
    diastolicBP: "diastolicBP",
    bloodType: "bloodType",
    hba1c: "hba1c",
    smokingStatus: "smokingStatus",
    activityLevel: "activityLevel",
    diabetesStatus: "diabetesStatus",
    heartDisease: "heartDiseaseStatus",
  };

  const key = fieldMap[fieldName];
  if (!key) return undefined;

  if (key === "regions") {
    const regions = userData[key];
    return regions && regions.length > 0 ? regions[0] : undefined;
  }

  return userData[key];
}

export function validateBinMembership(
  membershipResult: BinMembershipResult,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    (field) => !membershipResult.fieldCoverage[field]
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

export function createBinMembershipBitmap(
  binIndices: number[],
  totalBins: number
): number[] {
  const bitmap = new Array(totalBins).fill(0);
  
  for (const index of binIndices) {
    if (index >= 0 && index < totalBins) {
      bitmap[index] = 1;
    }
  }

  return bitmap;
}

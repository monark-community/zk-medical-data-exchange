import { BinType } from "@zk-medical/shared";
import type { BinConfiguration, DataBin } from "@zk-medical/shared";
import logger from "@/utils/logger";

/**
 * Converts a TypeScript BinConfiguration to Solidity DataBin[] format
 * for calling the configureBins() function on the Study smart contract.
 */
export interface SolidityDataBin {
  binId: string;
  criteriaField: string;
  binType: number; // 0 = Range, 1 = Categorical
  label: string;
  minValue: bigint;
  maxValue: bigint;
  includeMin: boolean;
  includeMax: boolean;
  categoriesBitmap: bigint;
}

/**
 * Convert TypeScript BinConfiguration to Solidity DataBin[] format
 * 
 * @param binConfig - The bin configuration from the frontend
 * @returns Array of bins in Solidity format, ready for contract call
 */
export function convertBinsForSolidity(binConfig: BinConfiguration): SolidityDataBin[] {
  if (!binConfig || !binConfig.bins || binConfig.bins.length === 0) {
    logger.warn("Empty or invalid bin configuration provided");
    return [];
  }

  logger.info({ totalBins: binConfig.bins.length }, "Converting bins to Solidity format");

  return binConfig.bins.map((bin: DataBin) => {
    // Determine bin type enum value
    let binType: number;
    if (bin.type === BinType.RANGE) {
      binType = 0;
    } else if (bin.type === BinType.CATEGORICAL) {
      binType = 1;
    } else {
      logger.warn({ binId: bin.id, binType: bin.type }, "Unknown bin type, defaulting to range");
      binType = 0;
    }

    // Convert range values to BigInt (use 0 if not applicable)
    const minValue = bin.minValue !== undefined ? BigInt(Math.floor(bin.minValue)) : BigInt(0);
    const maxValue = bin.maxValue !== undefined ? BigInt(Math.floor(bin.maxValue)) : BigInt(0);
    
    // Get include flags (default to true for min, false for max to get [min, max) behavior)
    const includeMin = bin.includeMin !== undefined ? bin.includeMin : true;
    const includeMax = bin.includeMax !== undefined ? bin.includeMax : false;

    // Convert categorical values to BigInt (use bitmap from categories array)
    let categoriesBitmap = BigInt(0);
    
    if (bin.categories && bin.categories.length > 0) {
      // Create bitmap from all categories
      for (const category of bin.categories) {
        categoriesBitmap |= BigInt(1) << BigInt(category);
      }
    }

    const solidityBin: SolidityDataBin = {
      binId: bin.id,
      criteriaField: bin.criteriaField,
      binType,
      label: bin.label,
      minValue,
      maxValue,
      includeMin,
      includeMax,
      categoriesBitmap,
    };

    logger.debug({ binId: bin.id, solidityBin }, "Converted bin to Solidity format");

    return solidityBin;
  });
}

/**
 * Validate that bins are properly formatted for Solidity
 * 
 * @param bins - Array of Solidity-formatted bins
 * @returns Object with isValid flag and any error messages
 */
export function validateSolidityBins(bins: SolidityDataBin[]): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (!bins || bins.length === 0) {
    errors.push("No bins provided");
    return { isValid: false, errors };
  }

  const binIds = new Set<string>();
  
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (!bin) continue;
    
    const prefix = `Bin ${i} (${bin.binId})`;

    // Check required fields
    if (!bin.binId || bin.binId.trim() === "") {
      errors.push(`${prefix}: binId is required`);
    }

    if (!bin.criteriaField || bin.criteriaField.trim() === "") {
      errors.push(`${prefix}: criteriaField is required`);
    }

    if (!bin.label || bin.label.trim() === "") {
      errors.push(`${prefix}: label is required`);
    }

    // Check for duplicate binIds
    if (binIds.has(bin.binId)) {
      errors.push(`${prefix}: Duplicate binId detected`);
    }
    binIds.add(bin.binId);

    // Validate binType
    if (![0, 1].includes(bin.binType)) {
      errors.push(`${prefix}: Invalid binType ${bin.binType}, must be 0 (range) or 1 (categorical)`);
    }

    // Type-specific validation
    if (bin.binType === 0) { // Range
      if (bin.minValue >= bin.maxValue) {
        errors.push(`${prefix}: Range bin must have minValue < maxValue`);
      }
      if (bin.minValue < BigInt(0)) {
        errors.push(`${prefix}: Range bin minValue must be >= 0`);
      }
    } else if (bin.binType === 1) { // Categorical
      if (bin.categoriesBitmap === BigInt(0)) {
        errors.push(`${prefix}: Categorical bin must have non-zero categoriesBitmap`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format bins for logging (converts BigInts to strings for JSON serialization)
 */
export function formatBinsForLogging(bins: SolidityDataBin[]): any[] {
  return bins.map(bin => ({
    ...bin,
    minValue: bin.minValue.toString(),
    maxValue: bin.maxValue.toString(),
    categoriesBitmap: bin.categoriesBitmap.toString(),
  }));
}

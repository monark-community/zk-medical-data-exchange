import { BinType } from "@zk-medical/shared";
import type { BinConfiguration, DataBin } from "@zk-medical/shared";
import logger from "@/utils/logger";

export interface SolidityDataBin {
  binId: bigint;
  criteriaField: string;
  binType: number;
  label: string;
  minValue: bigint;
  maxValue: bigint;
  includeMin: boolean;
  includeMax: boolean;
  categoriesBitmap: bigint;
}

export function convertBinsForSolidity(binConfig: BinConfiguration): SolidityDataBin[] {
  if (!binConfig || !binConfig.bins || binConfig.bins.length === 0) {
    logger.warn("Empty or invalid bin configuration provided");
    return [];
  }

  logger.info({ totalBins: binConfig.bins.length }, "Converting bins to Solidity format");

  return binConfig.bins.map((bin: DataBin) => {
    let binType: number;
    if (bin.type === BinType.RANGE) {
      binType = 0;
    } else if (bin.type === BinType.CATEGORICAL) {
      binType = 1;
    } else {
      logger.warn({ binId: bin.id, binType: bin.type }, "Unknown bin type, defaulting to range");
      binType = 0;
    }

    const minValue = bin.minValue !== undefined ? BigInt(Math.floor(bin.minValue)) : BigInt(0);
    const maxValue = bin.maxValue !== undefined ? BigInt(Math.floor(bin.maxValue)) : BigInt(0);
    
    const includeMin = bin.includeMin !== undefined ? bin.includeMin : true;
    const includeMax = bin.includeMax !== undefined ? bin.includeMax : false;

    let categoriesBitmap = BigInt(0);
    
    if (bin.categories && bin.categories.length > 0) {
      for (const category of bin.categories) {
        categoriesBitmap |= BigInt(1) << BigInt(category);
      }
    }

    const solidityBin: SolidityDataBin = {
      binId: BigInt(bin.numericId),
      criteriaField: bin.criteriaField,
      binType,
      label: bin.label,
      minValue,
      maxValue,
      includeMin,
      includeMax,
      categoriesBitmap,
    };

    logger.debug({ 
      stringId: bin.id, 
      numericId: bin.numericId, 
      solidityBin 
    }, "Converted bin to Solidity format");

    return solidityBin;
  });
}

export function validateSolidityBins(bins: SolidityDataBin[]): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (!bins || bins.length === 0) {
    errors.push("No bins provided");
    return { isValid: false, errors };
  }

  const binIds = new Set<bigint>();
  
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (!bin) continue;
    
    const prefix = `Bin ${i} (${bin.binId})`;

    if (bin.binId === undefined || bin.binId === null) {
      errors.push(`${prefix}: binId is required`);
    }

    if (!bin.criteriaField || bin.criteriaField.trim() === "") {
      errors.push(`${prefix}: criteriaField is required`);
    }

    if (!bin.label || bin.label.trim() === "") {
      errors.push(`${prefix}: label is required`);
    }

    if (binIds.has(bin.binId)) {
      errors.push(`${prefix}: Duplicate binId detected`);
    }
    binIds.add(bin.binId);

    if (![0, 1].includes(bin.binType)) {
      errors.push(`${prefix}: Invalid binType ${bin.binType}, must be 0 (range) or 1 (categorical)`);
    }

    if (bin.binType === 0) {
      if (bin.minValue >= bin.maxValue) {
        errors.push(`${prefix}: Range bin must have minValue < maxValue`);
      }
      if (bin.minValue < BigInt(0)) {
        errors.push(`${prefix}: Range bin minValue must be >= 0`);
      }
    } else if (bin.binType === 1) {
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

export function formatBinsForLogging(bins: SolidityDataBin[]): any[] {
  return bins.map(bin => ({
    ...bin,
    binId: bin.binId.toString(),
    minValue: bin.minValue.toString(),
    maxValue: bin.maxValue.toString(),
    categoriesBitmap: bin.categoriesBitmap.toString(),
  }));
}

export function createBinIdMap(binConfig: BinConfiguration): Map<string, number> {
  const map = new Map<string, number>();
  binConfig.bins.forEach((bin) => {
    map.set(bin.id, bin.numericId);
  });
  return map;
}

export function convertStringBinIdsToNumeric(
  stringBinIds: string[],
  binConfig: BinConfiguration
): number[] {
  const map = createBinIdMap(binConfig);
  return stringBinIds
    .map((stringId) => map.get(stringId))
    .filter((numericId): numericId is number => numericId !== undefined);
}

import {
  BinType,
  BinnableField,
  BINNABLE_FIELDS,
  DEFAULT_BIN_CONFIG,
  CATEGORICAL_LABELS,
  REGION_LABELS,
} from "./dataBins";
import type {
  DataBin,
  BinConfiguration,
  BinnableFieldMetadata,
  BinGenerationConfig,
} from "./dataBins";
import type { StudyCriteria } from "./studyCriteria";

import {
  BLOOD_TYPE_VALUES,
  GENDER_VALUES,
  SMOKING_VALUES,
  DIABETES_VALUES,
  HEART_DISEASE_VALUES,
} from "./constants/valueConstants";

export function generateBinsFromCriteria(
  criteria: StudyCriteria,
  config: Partial<BinGenerationConfig> = {}
): BinConfiguration {
  const fullConfig: BinGenerationConfig = { ...DEFAULT_BIN_CONFIG, ...config };
  const bins: DataBin[] = [];
  let globalBinIndex = 0;

  Object.values(BinnableField).forEach((field) => {
    const metadata = BINNABLE_FIELDS[field];
    const enableFlag = metadata.enableFlag as keyof StudyCriteria;

    if (criteria[enableFlag] === 1) {
      if (metadata.type === BinType.RANGE) {
        const rangeBins = generateRangeBins(field, criteria, metadata, fullConfig, globalBinIndex);
        globalBinIndex += rangeBins.length;
        bins.push(...rangeBins);
      } else if (metadata.type === BinType.CATEGORICAL) {
        const categoricalBins = generateCategoricalBins(field, criteria, metadata, globalBinIndex);
        globalBinIndex += categoricalBins.length;
        bins.push(...categoricalBins);
      }
    }
  });

  return {
    bins,
  };
}

function generateRangeBins(
  field: BinnableField,
  criteria: StudyCriteria,
  metadata: BinnableFieldMetadata,
  config: BinGenerationConfig,
  startingNumericId: number
): DataBin[] {
  const bins: DataBin[] = [];

  const { min, max } = extractMinMax(field, criteria);

  if (min === undefined || max === undefined || min >= max) {
    return bins;
  }

  const range = max - min;
  let binCount = config.defaultBinCount;

  if (range < 10) {
    binCount = Math.min(Math.floor(range), config.maxBinCount);
  } else if (range > 100) {
    binCount = Math.min(5, config.maxBinCount);
  }

  binCount = Math.max(2, Math.min(binCount, config.maxBinCount));

  const binWidth = range / binCount;

  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = i === binCount - 1 ? max : min + (i + 1) * binWidth;

    const roundedMin = roundToDecimalPlaces(binMin, metadata.decimalPlaces || 0);
    const roundedMax = roundToDecimalPlaces(binMax, metadata.decimalPlaces || 0);

    const binId = `${field}_bin_${i}`;
    const label = formatRangeBinLabel(
      metadata.label,
      roundedMin,
      roundedMax,
      metadata.unit,
      i === binCount - 1
    );

    bins.push({
      id: binId,
      numericId: startingNumericId + i,
      criteriaField: field,
      type: BinType.RANGE,
      label,
      minValue: roundedMin,
      maxValue: roundedMax,
      includeMin: true,
      includeMax: i === binCount - 1,
    });
  }

  return bins;
}

function extractMinMax(
  field: BinnableField,
  criteria: StudyCriteria
): { min: number | undefined; max: number | undefined } {
  switch (field) {
    case BinnableField.AGE:
      return { min: criteria.minAge, max: criteria.maxAge };
    case BinnableField.CHOLESTEROL:
      return { min: criteria.minCholesterol, max: criteria.maxCholesterol };
    case BinnableField.BMI:
      return {
        min: criteria.minBMI,
        max: criteria.maxBMI,
      };
    case BinnableField.SYSTOLIC_BP:
      return { min: criteria.minSystolic, max: criteria.maxSystolic };
    case BinnableField.DIASTOLIC_BP:
      return { min: criteria.minDiastolic, max: criteria.maxDiastolic };
    case BinnableField.HBA1C:
      return {
        min: criteria.minHbA1c,
        max: criteria.maxHbA1c,
      };
    case BinnableField.ACTIVITY_LEVEL:
      return { min: criteria.minActivityLevel, max: criteria.maxActivityLevel };
    default:
      return { min: undefined, max: undefined };
  }
}

function formatRangeBinLabel(
  fieldLabel: string,
  min: number,
  max: number,
  unit: string | undefined,
  isLast: boolean
): string {
  const unitStr = unit ? ` ${unit}` : "";
  const bracket = isLast ? "]" : ")";
  return `${fieldLabel}: [${min}, ${max}${bracket}${unitStr}`;
}

function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

function generateCategoricalBins(
  field: BinnableField,
  criteria: StudyCriteria,
  metadata: BinnableFieldMetadata,
  startingNumericId: number
): DataBin[] {
  const bins: DataBin[] = [];
  let binIndex = 0;

  const categories = extractAllowedCategories(field, criteria);

  if (!categories || (Array.isArray(categories) && categories.length === 0)) {
    console.warn(`No categories found for ${field}`);
    return bins;
  }

  const labelMap = getCategoryLabelMap(field);

  if (categories === 'ANY') {
    const allCategories = getAllPossibleCategories(field);
    allCategories.forEach((category) => {
      const binId = `${field}_bin_${binIndex}`;
      const label = `${metadata.label}: ${labelMap[category] || category}`;

      bins.push({
        id: binId,
        numericId: startingNumericId + binIndex,
        criteriaField: field,
        type: BinType.CATEGORICAL,
        label,
        categories: [category],
      });
      binIndex++;
    });
  } else {
    (categories as number[]).forEach((category) => {
      const binId = `${field}_bin_${binIndex}`;
      const label = `${metadata.label}: ${labelMap[category] || category}`;

      bins.push({
        id: binId,
        numericId: startingNumericId + binIndex,
        criteriaField: field,
        type: BinType.CATEGORICAL,
        label,
        categories: [category],
      });
      binIndex++;
    });
  }

  return bins;
}

function extractAllowedCategories(
  field: BinnableField,
  criteria: StudyCriteria
): number[] | 'ANY' {
  switch (field) {
    case BinnableField.BLOOD_TYPE:
      return criteria.allowedBloodTypes.filter((v) => v !== 0);
    case BinnableField.GENDER:
      return criteria.allowedGender === GENDER_VALUES.ANY ? 'ANY' : [criteria.allowedGender];
    case BinnableField.REGION:
      return criteria.allowedRegions.filter((v) => v !== 0);
    case BinnableField.SMOKING_STATUS:
      return criteria.allowedSmoking === SMOKING_VALUES.ANY ? 'ANY' : [criteria.allowedSmoking];
    case BinnableField.DIABETES_STATUS:
      return criteria.allowedDiabetes === DIABETES_VALUES.ANY_TYPE ? 'ANY' : [criteria.allowedDiabetes];
    case BinnableField.HEART_DISEASE:
      return criteria.allowedHeartDisease === HEART_DISEASE_VALUES.ANY ? 'ANY' : [criteria.allowedHeartDisease];
    default:
      return [];
  }
}

function getCategoryLabelMap(field: BinnableField): Record<number, string> {
  switch (field) {
    case BinnableField.BLOOD_TYPE:
      return CATEGORICAL_LABELS.bloodType || {};
    case BinnableField.GENDER:
      return CATEGORICAL_LABELS.gender || {};
    case BinnableField.REGION:
      return REGION_LABELS;
    case BinnableField.SMOKING_STATUS:
      return CATEGORICAL_LABELS.smokingStatus || {};
    case BinnableField.DIABETES_STATUS:
      return CATEGORICAL_LABELS.diabetesStatus || {};
    case BinnableField.HEART_DISEASE:
      return CATEGORICAL_LABELS.heartDisease || {};
    default:
      return {};
  }
}

function getAllPossibleCategories(field: BinnableField): number[] {
  switch (field) {
    case BinnableField.BLOOD_TYPE:
      return Object.values(BLOOD_TYPE_VALUES).filter(v => typeof v === 'number') as number[];
    case BinnableField.GENDER:
      return [GENDER_VALUES.MALE, GENDER_VALUES.FEMALE];
    case BinnableField.REGION:
      return Object.keys(REGION_LABELS).map(Number);
    case BinnableField.SMOKING_STATUS:
      return [SMOKING_VALUES.NEVER_SMOKED, SMOKING_VALUES.CURRENT_SMOKER, SMOKING_VALUES.FORMER_SMOKER];
    case BinnableField.DIABETES_STATUS:
      return [DIABETES_VALUES.NO_DIABETES, DIABETES_VALUES.TYPE_1, DIABETES_VALUES.TYPE_2, DIABETES_VALUES.UNSPECIFIED, DIABETES_VALUES.PRE_DIABETES];
    case BinnableField.HEART_DISEASE:
      return [
        HEART_DISEASE_VALUES.NO_HISTORY,
        HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK,
        HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION,
        HEART_DISEASE_VALUES.FAMILY_HISTORY,
      ];
    default:
      return [];
  }
}

export function findBinForValue(
  value: number,
  bins: DataBin[],
  field: BinnableField
): string | null {
  for (const bin of bins) {
    if (bin.criteriaField !== field) continue;

    if (bin.type === BinType.RANGE) {
      const { minValue, maxValue, includeMin, includeMax } = bin;
      if (minValue === undefined || maxValue === undefined) continue;

      const meetsMin = includeMin ? value >= minValue : value > minValue;
      const meetsMax = includeMax ? value <= maxValue : value < maxValue;

      if (meetsMin && meetsMax) {
        return bin.id;
      }
    } else if (bin.type === BinType.CATEGORICAL) {
      if (bin.categories?.includes(value)) {
        return bin.id;
      }
    }
  }

  return null;
}

export function computeParticipantBins(
  medicalData: Record<string, number>,
  bins: DataBin[]
): string[] {
  const participantBins: string[] = [];

  const fieldMapping: Record<BinnableField, string> = {
    [BinnableField.AGE]: "age",
    [BinnableField.CHOLESTEROL]: "cholesterol",
    [BinnableField.BMI]: "bmi",
    [BinnableField.SYSTOLIC_BP]: "systolicBP",
    [BinnableField.DIASTOLIC_BP]: "diastolicBP",
    [BinnableField.HBA1C]: "hba1c",
    [BinnableField.ACTIVITY_LEVEL]: "activityLevel",
    [BinnableField.BLOOD_TYPE]: "bloodType",
    [BinnableField.GENDER]: "gender",
    [BinnableField.REGION]: "region",
    [BinnableField.SMOKING_STATUS]: "smokingStatus",
    [BinnableField.DIABETES_STATUS]: "diabetesStatus",
    [BinnableField.HEART_DISEASE]: "heartDiseaseHistory",
  };

  const binsByField = new Map<BinnableField, DataBin[]>();
  bins.forEach((bin) => {
    const field = bin.criteriaField as BinnableField;
    if (!binsByField.has(field)) {
      binsByField.set(field, []);
    }
    binsByField.get(field)!.push(bin);
  });

  binsByField.forEach((fieldBins, field) => {
    const dataKey = fieldMapping[field];
    const value = medicalData[dataKey];

    if (value !== undefined) {
      const binId = findBinForValue(value, fieldBins, field);
      if (binId) {
        participantBins.push(binId);
      }
    }
  });

  return participantBins;
}

export function validateBinConfiguration(config: BinConfiguration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.bins || config.bins.length === 0) {
    errors.push("No bins defined");
  }

  const binIds = new Set<string>();
  config.bins.forEach((bin) => {
    if (binIds.has(bin.id)) {
      errors.push(`Duplicate bin ID: ${bin.id}`);
    }
    binIds.add(bin.id);

    if (bin.type === BinType.RANGE) {
      if (bin.minValue === undefined || bin.maxValue === undefined) {
        errors.push(`Range bin ${bin.id} missing min/max values`);
      } else if (bin.minValue >= bin.maxValue) {
        errors.push(`Range bin ${bin.id} has invalid range: ${bin.minValue} >= ${bin.maxValue}`);
      }
    }

    if (bin.type === BinType.CATEGORICAL) {
      if (!bin.categories || bin.categories.length === 0) {
        errors.push(`Categorical bin ${bin.id} has no categories`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

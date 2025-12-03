/* eslint-disable no-unused-vars */
import {
  BLOOD_TYPE_VALUES,
  GENDER_VALUES,
  SMOKING_VALUES,
  DIABETES_VALUES,
  HEART_DISEASE_VALUES,
  REGION_VALUES,
} from "./constants/valueConstants";

export enum BinType {
  RANGE = "RANGE",
  CATEGORICAL = "CATEGORICAL",
}

export interface DataBin {
  id: string; // Human-readable ID like "age_bin_0" for display
  numericId: number; // Sequential numeric ID (0, 1, 2, ...) for blockchain
  criteriaField: string;
  type: BinType;
  label: string;
  minValue?: number;
  maxValue?: number;
  includeMin?: boolean;
  includeMax?: boolean;
  categories?: number[];
}

export interface BinConfiguration {
  bins: DataBin[];
}

export interface BinMembership {
  binId: string;
  participantAddress: string;
  commitment: string;
  timestamp: number;
}

export interface BinStatistics {
  binId: string;
  count: number;
  percentage?: number;
}

export interface StudyAggregation {
  studyId: number;
  totalParticipants: number;
  activeParticipants: number;
  binStatistics: BinStatistics[];
  generatedAt: number;
  meetsMinimumThreshold: boolean;
}

export interface BinGenerationConfig {
  defaultBinCount: number;
  minBinSize: number;
  maxBinCount: number;
  minParticipantsPerBin: number;
  includePercentages: boolean;
}

export const DEFAULT_BIN_CONFIG: BinGenerationConfig = {
  defaultBinCount: 4,
  minBinSize: 5,
  maxBinCount: 10,
  minParticipantsPerBin: 5,
  includePercentages: true,
};

export enum BinnableField {
  AGE = "age",
  CHOLESTEROL = "cholesterol",
  BMI = "bmi",
  SYSTOLIC_BP = "systolicBP",
  DIASTOLIC_BP = "diastolicBP",
  HBA1C = "hba1c",
  ACTIVITY_LEVEL = "activityLevel",
  BLOOD_TYPE = "bloodType",
  GENDER = "gender",
  REGION = "region",
  SMOKING_STATUS = "smokingStatus",
  DIABETES_STATUS = "diabetesStatus",
  HEART_DISEASE = "heartDisease",
}

export interface BinnableFieldMetadata {
  field: BinnableField;
  type: BinType;
  label: string;
  unit?: string;
  decimalPlaces?: number;
  enableFlag: string;
}

export const BINNABLE_FIELDS: Record<BinnableField, BinnableFieldMetadata> = {
  [BinnableField.AGE]: {
    field: BinnableField.AGE,
    type: BinType.RANGE,
    label: "Age",
    unit: "years",
    decimalPlaces: 0,
    enableFlag: "enableAge",
  },
  [BinnableField.CHOLESTEROL]: {
    field: BinnableField.CHOLESTEROL,
    type: BinType.RANGE,
    label: "Cholesterol",
    unit: "mg/dL",
    decimalPlaces: 0,
    enableFlag: "enableCholesterol",
  },
  [BinnableField.BMI]: {
    field: BinnableField.BMI,
    type: BinType.RANGE,
    label: "BMI",
    unit: "",
    decimalPlaces: 1,
    enableFlag: "enableBMI",
  },
  [BinnableField.SYSTOLIC_BP]: {
    field: BinnableField.SYSTOLIC_BP,
    type: BinType.RANGE,
    label: "Systolic Blood Pressure",
    unit: "mmHg",
    decimalPlaces: 0,
    enableFlag: "enableBloodPressure",
  },
  [BinnableField.DIASTOLIC_BP]: {
    field: BinnableField.DIASTOLIC_BP,
    type: BinType.RANGE,
    label: "Diastolic Blood Pressure",
    unit: "mmHg",
    decimalPlaces: 0,
    enableFlag: "enableBloodPressure",
  },
  [BinnableField.HBA1C]: {
    field: BinnableField.HBA1C,
    type: BinType.RANGE,
    label: "HbA1c",
    unit: "%",
    decimalPlaces: 1,
    enableFlag: "enableHbA1c",
  },
  [BinnableField.ACTIVITY_LEVEL]: {
    field: BinnableField.ACTIVITY_LEVEL,
    type: BinType.RANGE,
    label: "Physical Activity",
    unit: "",
    decimalPlaces: 0,
    enableFlag: "enableActivity",
  },
  [BinnableField.BLOOD_TYPE]: {
    field: BinnableField.BLOOD_TYPE,
    type: BinType.CATEGORICAL,
    label: "Blood Type",
    enableFlag: "enableBloodType",
  },
  [BinnableField.GENDER]: {
    field: BinnableField.GENDER,
    type: BinType.CATEGORICAL,
    label: "Gender",
    enableFlag: "enableGender",
  },
  [BinnableField.REGION]: {
    field: BinnableField.REGION,
    type: BinType.CATEGORICAL,
    label: "Region",
    enableFlag: "enableLocation",
  },
  [BinnableField.SMOKING_STATUS]: {
    field: BinnableField.SMOKING_STATUS,
    type: BinType.CATEGORICAL,
    label: "Smoking Status",
    enableFlag: "enableSmoking",
  },
  [BinnableField.DIABETES_STATUS]: {
    field: BinnableField.DIABETES_STATUS,
    type: BinType.CATEGORICAL,
    label: "Diabetes Status",
    enableFlag: "enableDiabetes",
  },
  [BinnableField.HEART_DISEASE]: {
    field: BinnableField.HEART_DISEASE,
    type: BinType.CATEGORICAL,
    label: "Heart Disease History",
    enableFlag: "enableHeartDisease",
  },
};

export const CATEGORICAL_LABELS: Record<string, Record<number, string>> = {
  bloodType: {
    [BLOOD_TYPE_VALUES.O_POSITIVE]: "O+",
    [BLOOD_TYPE_VALUES.O_NEGATIVE]: "O-",
    [BLOOD_TYPE_VALUES.A_POSITIVE]: "A+",
    [BLOOD_TYPE_VALUES.A_NEGATIVE]: "A-",
    [BLOOD_TYPE_VALUES.B_POSITIVE]: "B+",
    [BLOOD_TYPE_VALUES.B_NEGATIVE]: "B-",
    [BLOOD_TYPE_VALUES.AB_POSITIVE]: "AB+",
    [BLOOD_TYPE_VALUES.AB_NEGATIVE]: "AB-",
  },
  gender: {
    [GENDER_VALUES.ANY]: "Any",
    [GENDER_VALUES.MALE]: "Male",
    [GENDER_VALUES.FEMALE]: "Female",
  },
  smokingStatus: {
    [SMOKING_VALUES.NEVER_SMOKED]: "Non-smoker",
    [SMOKING_VALUES.CURRENT_SMOKER]: "Current smoker",
    [SMOKING_VALUES.FORMER_SMOKER]: "Former smoker",
    [SMOKING_VALUES.ANY]: "Any",
  },
  diabetesStatus: {
    [DIABETES_VALUES.NO_DIABETES]: "No diabetes",
    [DIABETES_VALUES.TYPE_1]: "Type 1",
    [DIABETES_VALUES.TYPE_2]: "Type 2",
    [DIABETES_VALUES.ANY_TYPE]: "Any",
  },
  heartDisease: {
    [HEART_DISEASE_VALUES.NO_HISTORY]: "No history",
    [HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK]: "Has history",
    [HEART_DISEASE_VALUES.CURRENT_CONDITION]: "Has history",
    [HEART_DISEASE_VALUES.FAMILY_HISTORY]: "Has history",
    [HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION]: "Has history",
  },
};

export const REGION_LABELS: Record<number, string> = {
  [REGION_VALUES.NORTH_AMERICA]: "North America",
  [REGION_VALUES.EUROPE]: "Europe",
  [REGION_VALUES.ASIA]: "Asia",
  [REGION_VALUES.SOUTH_AMERICA]: "South America",
  [REGION_VALUES.AFRICA]: "Africa",
  [REGION_VALUES.OCEANIA]: "Oceania",
  [REGION_VALUES.MIDDLE_EAST]: "Middle East",
  [REGION_VALUES.CENTRAL_AMERICA]: "Central America",
};

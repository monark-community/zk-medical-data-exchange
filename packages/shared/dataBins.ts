export enum BinType {
  RANGE = "RANGE",
  CATEGORICAL = "CATEGORICAL",
}

export interface DataBin {
  id: string;
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
  studyId: number;
  bins: DataBin[];
  createdAt: number;
  version: string;
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
    unit: "min/week",
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
    1: "O+",
    2: "O-",
    3: "A+",
    4: "A-",
    5: "B+",
    6: "B-",
    7: "AB+",
    8: "AB-",
  },
  gender: {
    0: "Any",
    1: "Male",
    2: "Female",
  },
  smokingStatus: {
    0: "Non-smoker",
    1: "Current smoker",
    2: "Former smoker",
    3: "Any",
  },
  diabetesStatus: {
    0: "No diabetes",
    1: "Type 1",
    2: "Type 2",
    3: "Any",
  },
  heartDisease: {
    0: "No history",
    1: "Has history",
    2: "Any",
  },
};

export const REGION_LABELS: Record<number, string> = {
  1: "North America",
  2: "Europe",
  3: "Asia",
  4: "South America",
  5: "Africa",
  6: "Oceania",
};

export const GENDER_VALUES = {
  MALE: 1,
  FEMALE: 2,
  OTHER: 0,
  UNKNOWN: 0,
  ANY: 0,
} as const;

export const SMOKING_VALUES = {
  NEVER_SMOKED: 0,
  CURRENT_SMOKER: 1,
  FORMER_SMOKER: 2,
  ANY: 3,
} as const;

export const REGION_VALUES = {
  NORTH_AMERICA: 1,
  EUROPE: 2,
  ASIA: 3,
  SOUTH_AMERICA: 4,
  AFRICA: 5,
  OCEANIA: 6,
  MIDDLE_EAST: 7,
  CENTRAL_AMERICA: 8,
} as const;

export const BLOOD_TYPE_VALUES = {
  O_POSITIVE: 1,
  O_NEGATIVE: 2,
  A_POSITIVE: 3,
  A_NEGATIVE: 4,
  B_POSITIVE: 5,
  B_NEGATIVE: 6,
  AB_POSITIVE: 7,
  AB_NEGATIVE: 8,
} as const;

export const ACTIVITY_LEVEL_VALUES = {
  SEDENTARY: 1,
  LIGHTLY_ACTIVE: 2,
  MODERATELY_ACTIVE: 3,
  VERY_ACTIVE: 4,
  EXTREMELY_ACTIVE: 5,
} as const;

export const DIABETES_VALUES = {
  NO_DIABETES: 0,
  TYPE_1: 1,
  TYPE_2: 2,
  UNSPECIFIED: 3,
  PRE_DIABETES: 4,
  ANY_TYPE: 5,
} as const;

export const HEART_DISEASE_VALUES = {
  NO_HISTORY: 0,
  PREVIOUS_HEART_ATTACK: 1,
  CARDIOVASCULAR_CONDITION: 2,
  FAMILY_HISTORY: 3,
  CURRENT_CONDITION: 4,
  ANY: 5,
} as const;

export type GenderValue = (typeof GENDER_VALUES)[keyof typeof GENDER_VALUES];
export type SmokingValue = (typeof SMOKING_VALUES)[keyof typeof SMOKING_VALUES];
export type RegionValue = (typeof REGION_VALUES)[keyof typeof REGION_VALUES];
export type BloodTypeValue = (typeof BLOOD_TYPE_VALUES)[keyof typeof BLOOD_TYPE_VALUES];
export type ActivityLevelValue = (typeof ACTIVITY_LEVEL_VALUES)[keyof typeof ACTIVITY_LEVEL_VALUES];
export type DiabetesValue = (typeof DIABETES_VALUES)[keyof typeof DIABETES_VALUES];
export type HeartDiseaseValue = (typeof HEART_DISEASE_VALUES)[keyof typeof HEART_DISEASE_VALUES];

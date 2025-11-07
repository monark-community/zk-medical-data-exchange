/**
 * Medical Data Constants & Mappings
 * Centralized definitions for all medical data value mappings used across:
 * - Study creation forms (UI dropdowns)
 * - FHIR data parsing (healthcare standards)
 * - ZK circuit proofs (numeric values)
 * - API validation (backend processing)
 */

// ========================================
// CORE VALUE MAPPINGS
// ========================================

/**
 * Gender value mappings
 * Used in: FHIR Patient.gender, Study criteria, ZK proofs
 */
export const GENDER_VALUES = {
  MALE: 1,
  FEMALE: 2,
  OTHER: 0,
  UNKNOWN: 0,
  ANY: 0,
} as const;

/**
 * Smoking status value mappings
 * Used in: FHIR Observation, Study criteria, ZK proofs
 */
export const SMOKING_VALUES = {
  NEVER_SMOKED: 0,
  CURRENT_SMOKER: 1,
  FORMER_SMOKER: 2,
  ANY: 3, // For study criteria only
} as const;

/**
 * Geographic region value mappings
 * Used in: FHIR Address, Study criteria, ZK proofs
 */
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

/**
 * Blood type value mappings
 * Used in: FHIR Observation, Study criteria, ZK proofs
 */
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

/**
 * Physical activity level value mappings
 * Used in: FHIR Observation, Study criteria, ZK proofs
 */
export const ACTIVITY_LEVEL_VALUES = {
  SEDENTARY: 1,
  LIGHTLY_ACTIVE: 2,
  MODERATELY_ACTIVE: 3,
  VERY_ACTIVE: 4,
  EXTREMELY_ACTIVE: 5,
} as const;

/**
 * FHIR activity level SNOMED CT codes to internal values
 * LOINC codes: 41950-7 (Number of days per week engaged in moderate to vigorous physical activity)
 *              89558-1 (Physical activity level)
 * Note: Some activity levels have 2 codes mapping to same level
 */
export const FHIR_ACTIVITY_LEVEL_SNOMED = {
  "160646008": ACTIVITY_LEVEL_VALUES.SEDENTARY, // Level 0 - No moderate/vigorous activity
  "267124003": ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE, // Level 1 - 1–4 mixed activity sessions in 4 weeks
  "160647004": ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE, // Level 1 - 1–4 mixed activity sessions in 4 weeks
  "160648009": ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE, // Level 2 - 5–11 mixed activity sessions
  "160649001": ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE, // Level 3 - ≥12 moderate activity sessions
  "160650001": ACTIVITY_LEVEL_VALUES.VERY_ACTIVE, // Level 4 - ≥12 moderate/vigorous mixed sessions
  "267126001": ACTIVITY_LEVEL_VALUES.VERY_ACTIVE, // Level 4 - ≥12 moderate/vigorous mixed sessions
  "160651002": ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE, // Level 5 - ≥12 vigorous activity sessions
  "267127005": ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE, // Level 5 - ≥12 vigorous activity sessions
} as const;

/**
 * Diabetes status value mappings
 * Used in: FHIR Condition, Study criteria, ZK proofs
 */
export const DIABETES_VALUES = {
  NO_DIABETES: 0,
  TYPE_1: 1,
  TYPE_2: 2,
  UNSPECIFIED: 3,
  PRE_DIABETES: 4,
  ANY_TYPE: 5, // For study criteria only
} as const;

/**
 * Heart disease status value mappings
 * Used in: FHIR Condition, Study criteria, ZK proofs
 */
export const HEART_DISEASE_VALUES = {
  NO_HISTORY: 0,
  PREVIOUS_HEART_ATTACK: 1,
  CARDIOVASCULAR_CONDITION: 2,
  FAMILY_HISTORY: 3,
  CURRENT_CONDITION: 4,
} as const;

// ========================================
// FHIR STANDARD CODE MAPPINGS
// ========================================

/**
 * FHIR gender codes to internal values
 * FHIR: http://hl7.org/fhir/administrative-gender
 */
export const FHIR_GENDER_CODES = {
  male: GENDER_VALUES.MALE,
  female: GENDER_VALUES.FEMALE,
  other: GENDER_VALUES.OTHER,
  unknown: GENDER_VALUES.UNKNOWN,
} as const;

/**
 * FHIR blood type SNOMED CT codes to internal values
 */
export const FHIR_BLOOD_TYPE_SNOMED = {
  "278149003": BLOOD_TYPE_VALUES.A_POSITIVE, // A+
  "278152006": BLOOD_TYPE_VALUES.A_NEGATIVE, // A-
  "278150003": BLOOD_TYPE_VALUES.B_POSITIVE, // B+
  "278153001": BLOOD_TYPE_VALUES.B_NEGATIVE, // B-
  "278151004": BLOOD_TYPE_VALUES.AB_POSITIVE, // AB+
  "278154007": BLOOD_TYPE_VALUES.AB_NEGATIVE, // AB-
  "278147001": BLOOD_TYPE_VALUES.O_POSITIVE, // O+
  "278148006": BLOOD_TYPE_VALUES.O_NEGATIVE, // O-
} as const;

/**
 * FHIR blood type text representations to internal values
 */
export const FHIR_BLOOD_TYPE_TEXT = {
  "A+": BLOOD_TYPE_VALUES.A_POSITIVE,
  "A positive": BLOOD_TYPE_VALUES.A_POSITIVE,
  "A-": BLOOD_TYPE_VALUES.A_NEGATIVE,
  "A negative": BLOOD_TYPE_VALUES.A_NEGATIVE,
  "B+": BLOOD_TYPE_VALUES.B_POSITIVE,
  "B positive": BLOOD_TYPE_VALUES.B_POSITIVE,
  "B-": BLOOD_TYPE_VALUES.B_NEGATIVE,
  "B negative": BLOOD_TYPE_VALUES.B_NEGATIVE,
  "AB+": BLOOD_TYPE_VALUES.AB_POSITIVE,
  "AB positive": BLOOD_TYPE_VALUES.AB_POSITIVE,
  "AB-": BLOOD_TYPE_VALUES.AB_NEGATIVE,
  "AB negative": BLOOD_TYPE_VALUES.AB_NEGATIVE,
  "O+": BLOOD_TYPE_VALUES.O_POSITIVE,
  "O positive": BLOOD_TYPE_VALUES.O_POSITIVE,
  "O-": BLOOD_TYPE_VALUES.O_NEGATIVE,
  "O negative": BLOOD_TYPE_VALUES.O_NEGATIVE,
} as const;

/**
 * FHIR smoking status SNOMED CT codes to internal values
 */
export const FHIR_SMOKING_SNOMED = {
  "266919005": SMOKING_VALUES.NEVER_SMOKED, // Never smoked
  "77176002": SMOKING_VALUES.CURRENT_SMOKER, // Current smoker
  "8517006": SMOKING_VALUES.FORMER_SMOKER, // Former smoker
  "428041000124106": SMOKING_VALUES.CURRENT_SMOKER, // Current occasional smoker
  "449868002": SMOKING_VALUES.CURRENT_SMOKER, // Daily Smoker
  "8392000": SMOKING_VALUES.NEVER_SMOKED, // Ex-smoker
} as const;

/**
 * FHIR smoking status text representations to internal values
 */
export const FHIR_SMOKING_TEXT = {
  never: SMOKING_VALUES.NEVER_SMOKED,
  "never smoked": SMOKING_VALUES.NEVER_SMOKED,
  "non-smoker": SMOKING_VALUES.NEVER_SMOKED,
  current: SMOKING_VALUES.CURRENT_SMOKER,
  smoker: SMOKING_VALUES.CURRENT_SMOKER,
  "current smoker": SMOKING_VALUES.CURRENT_SMOKER,
  former: SMOKING_VALUES.FORMER_SMOKER,
  "ex-smoker": SMOKING_VALUES.FORMER_SMOKER,
  "former smoker": SMOKING_VALUES.FORMER_SMOKER,
} as const;

/**
 * FHIR diabetes ICD-10 codes to internal values
 */
export const FHIR_DIABETES_ICD10 = {
  E10: DIABETES_VALUES.TYPE_1, // Type 1 diabetes
  E11: DIABETES_VALUES.TYPE_2, // Type 2 diabetes
  E13: DIABETES_VALUES.TYPE_2, // Other specified diabetes
  E14: DIABETES_VALUES.UNSPECIFIED, // Unspecified diabetes
  "R73.03": DIABETES_VALUES.PRE_DIABETES, // Pre-diabetes
  "R73.9": DIABETES_VALUES.PRE_DIABETES, // Hyperglycemia, unspecified
} as const;

/**
 * FHIR diabetes SNOMED CT codes to internal values
 */
export const FHIR_DIABETES_SNOMED = {
  "46635009": DIABETES_VALUES.TYPE_1, // Type 1 diabetes
  "44054006": DIABETES_VALUES.TYPE_2, // Type 2 diabetes
  "9414007": DIABETES_VALUES.PRE_DIABETES, // Secondary diabetes
  "73211009": DIABETES_VALUES.UNSPECIFIED, // Diabetes mellitus (unspecified)
} as const;

/**
 * FHIR heart disease ICD-10 codes to internal values
 */
export const FHIR_HEART_DISEASE_ICD10 = {
  I21: HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // Acute myocardial infarction
  I22: HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // Subsequent myocardial infarction
  I25: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Chronic ischemic heart disease
  I50: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Heart failure
  I20: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Angina pectoris
  I42: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Cardiomyopathy
  "Z87.891": HEART_DISEASE_VALUES.FAMILY_HISTORY, // Personal history context
} as const;

/**
 * FHIR heart disease SNOMED CT codes to internal values
 */
export const FHIR_HEART_DISEASE_SNOMED = {
  "22298006": HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // Myocardial infarction
  "414545008": HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // History of myocardial infarction
  "57054005": HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // Acute myocardial infarction
  "194828000": HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Angina
  "429457004": HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Cardiovascular disease
  "84114007": HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Heart failure
  "49601007": HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Disorder of cardiovascular system
  "53741008": HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, // Coronary arteriosclerosis
  "429559004": HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, // Typical angina (family history)
  "275104002": HEART_DISEASE_VALUES.FAMILY_HISTORY, // Family history of ischemic heart disease
  "297242006": HEART_DISEASE_VALUES.FAMILY_HISTORY, // Family history of cardiovascular disease
  "275120007": HEART_DISEASE_VALUES.FAMILY_HISTORY, // Chronic ischemic heart disease
} as const;

/**
 * ISO country codes to region mappings
 */
export const COUNTRY_TO_REGION = {
  // North America
  US: REGION_VALUES.NORTH_AMERICA,
  CA: REGION_VALUES.NORTH_AMERICA,
  MX: REGION_VALUES.NORTH_AMERICA,

  // Europe
  GB: REGION_VALUES.EUROPE,
  DE: REGION_VALUES.EUROPE,
  FR: REGION_VALUES.EUROPE,
  IT: REGION_VALUES.EUROPE,
  ES: REGION_VALUES.EUROPE,
  NL: REGION_VALUES.EUROPE,
  BE: REGION_VALUES.EUROPE,
  AT: REGION_VALUES.EUROPE,
  CH: REGION_VALUES.EUROPE,
  SE: REGION_VALUES.EUROPE,
  NO: REGION_VALUES.EUROPE,
  DK: REGION_VALUES.EUROPE,
  FI: REGION_VALUES.EUROPE,
  PL: REGION_VALUES.EUROPE,
  CZ: REGION_VALUES.EUROPE,
  HU: REGION_VALUES.EUROPE,
  IE: REGION_VALUES.EUROPE,
  PT: REGION_VALUES.EUROPE,

  // Asia
  CN: REGION_VALUES.ASIA,
  JP: REGION_VALUES.ASIA,
  KR: REGION_VALUES.ASIA,
  IN: REGION_VALUES.ASIA,
  TH: REGION_VALUES.ASIA,
  SG: REGION_VALUES.ASIA,
  MY: REGION_VALUES.ASIA,
  VN: REGION_VALUES.ASIA,
  PH: REGION_VALUES.ASIA,
  ID: REGION_VALUES.ASIA,
  BD: REGION_VALUES.ASIA,
  PK: REGION_VALUES.ASIA,
  LK: REGION_VALUES.ASIA,
  MM: REGION_VALUES.ASIA,
  KH: REGION_VALUES.ASIA,
  LA: REGION_VALUES.ASIA,

  // South America
  BR: REGION_VALUES.SOUTH_AMERICA,
  AR: REGION_VALUES.SOUTH_AMERICA,
  CL: REGION_VALUES.SOUTH_AMERICA,
  PE: REGION_VALUES.SOUTH_AMERICA,
  CO: REGION_VALUES.SOUTH_AMERICA,
  VE: REGION_VALUES.SOUTH_AMERICA,
  EC: REGION_VALUES.SOUTH_AMERICA,
  UY: REGION_VALUES.SOUTH_AMERICA,
  PY: REGION_VALUES.SOUTH_AMERICA,

  // Africa
  ZA: REGION_VALUES.AFRICA,
  NG: REGION_VALUES.AFRICA,
  KE: REGION_VALUES.AFRICA,
  ET: REGION_VALUES.AFRICA,
  EG: REGION_VALUES.AFRICA,
  MA: REGION_VALUES.AFRICA,
  GH: REGION_VALUES.AFRICA,
  TN: REGION_VALUES.AFRICA,
  DZ: REGION_VALUES.AFRICA,

  // Oceania
  AU: REGION_VALUES.OCEANIA,
  NZ: REGION_VALUES.OCEANIA,
  FJ: REGION_VALUES.OCEANIA,
  PG: REGION_VALUES.OCEANIA,
  NC: REGION_VALUES.OCEANIA,
  VU: REGION_VALUES.OCEANIA,
  SB: REGION_VALUES.OCEANIA,

  // Middle East
  SA: REGION_VALUES.MIDDLE_EAST,
  AE: REGION_VALUES.MIDDLE_EAST,
  IR: REGION_VALUES.MIDDLE_EAST,
  IQ: REGION_VALUES.MIDDLE_EAST,
  IL: REGION_VALUES.MIDDLE_EAST,
  JO: REGION_VALUES.MIDDLE_EAST,
  LB: REGION_VALUES.MIDDLE_EAST,
  SY: REGION_VALUES.MIDDLE_EAST,
  TR: REGION_VALUES.MIDDLE_EAST,
  KW: REGION_VALUES.MIDDLE_EAST,
  QA: REGION_VALUES.MIDDLE_EAST,
  BH: REGION_VALUES.MIDDLE_EAST,
  OM: REGION_VALUES.MIDDLE_EAST,
  YE: REGION_VALUES.MIDDLE_EAST,

  // Central America
  GT: REGION_VALUES.CENTRAL_AMERICA,
  BZ: REGION_VALUES.CENTRAL_AMERICA,
  SV: REGION_VALUES.CENTRAL_AMERICA,
  HN: REGION_VALUES.CENTRAL_AMERICA,
  NI: REGION_VALUES.CENTRAL_AMERICA,
  CR: REGION_VALUES.CENTRAL_AMERICA,
  PA: REGION_VALUES.CENTRAL_AMERICA,
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

export type GenderValue = (typeof GENDER_VALUES)[keyof typeof GENDER_VALUES];
export type SmokingValue = (typeof SMOKING_VALUES)[keyof typeof SMOKING_VALUES];
export type RegionValue = (typeof REGION_VALUES)[keyof typeof REGION_VALUES];
export type BloodTypeValue = (typeof BLOOD_TYPE_VALUES)[keyof typeof BLOOD_TYPE_VALUES];
export type ActivityLevelValue = (typeof ACTIVITY_LEVEL_VALUES)[keyof typeof ACTIVITY_LEVEL_VALUES];
export type DiabetesValue = (typeof DIABETES_VALUES)[keyof typeof DIABETES_VALUES];
export type HeartDiseaseValue = (typeof HEART_DISEASE_VALUES)[keyof typeof HEART_DISEASE_VALUES];

/**
 * FHIR to ZK Circuit Mappings
 * This service maps FHIR standard values to numeric values used in ZK circuits
 *
 * FHIR Resources that contain medical criteria:
 * - Patient: demographics (gender, birthDate for age calculation)
 * - Observation: vitals, lab values (cholesterol, BMI, blood pressure, HbA1c, smoking status, activity)
 * - Condition: medical conditions (diabetes, heart disease)
 *
 * It maps to same values defined in the frontend StudyFormFields and backend StudyCriteria
 */

// TODO: [LT] Verify when generating zkproof if everything in this fle is actually useful/needed
// ========================================
// GENDER MAPPINGS (FHIR Patient.gender)
// ========================================

/**
 * Maps FHIR gender codes to ZK circuit values
 * FHIR: http://hl7.org/fhir/administrative-gender
 */
export const fhirGenderToZK = (fhirGender: string): number => {
  const mapping: { [key: string]: number } = {
    male: 1,
    female: 2,
    other: 0,
    unknown: 0,
  };
  return mapping[fhirGender.toLowerCase()] || 0;
};

// ========================================
// BLOOD TYPE MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR blood type codes to ZK circuit values
 * FHIR uses SNOMED CT codes for blood types
 */
export const fhirBloodTypeToZK = (fhirBloodType: string): number => {
  // SNOMED CT codes for blood types
  const snomedMapping: { [key: string]: number } = {
    "278149003": 1, // A+
    "278148006": 2, // A-
    "278152006": 3, // B+
    "278151004": 4, // B-
    "278154007": 5, // AB+
    "278153001": 6, // AB-
    "278155008": 7, // O+
    "278156009": 8, // O-
  };

  // Also support common text representations
  const textMapping: { [key: string]: number } = {
    "A+": 1,
    "A positive": 1,
    "A-": 2,
    "A negative": 2,
    "B+": 3,
    "B positive": 3,
    "B-": 4,
    "B negative": 4,
    "AB+": 5,
    "AB positive": 5,
    "AB-": 6,
    "AB negative": 6,
    "O+": 7,
    "O positive": 7,
    "O-": 8,
    "O negative": 8,
  };

  return snomedMapping[fhirBloodType] || textMapping[fhirBloodType] || 0;
};

// ========================================
// SMOKING STATUS MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR smoking status codes to ZK circuit values
 * FHIR uses SNOMED CT codes for smoking status
 */
export const fhirSmokingStatusToZK = (smokingCode: string): number => {
  const snomedMapping: { [key: string]: number } = {
    "266919005": 0, // Never smoked
    "77176002": 1, // Current smoker
    "8517006": 2, // Former smoker
    "428041000124106": 1, // Current some day smoker
    "428061000124105": 1, // Current heavy tobacco smoker
  };

  const textMapping: { [key: string]: number } = {
    never: 0,
    "never smoked": 0,
    "non-smoker": 0,
    current: 1,
    smoker: 1,
    "current smoker": 1,
    former: 2,
    "ex-smoker": 2,
    "former smoker": 2,
  };

  return snomedMapping[smokingCode] || textMapping[smokingCode.toLowerCase()] || 3; // default to 'any'
};

// ========================================
// DIABETES MAPPINGS (FHIR Condition)
// ========================================

/**
 * Maps FHIR diabetes condition codes to ZK circuit values
 * FHIR uses ICD-10 or SNOMED CT codes for diabetes
 */
export const fhirDiabetesToZK = (diabetesCode: string, conditionText?: string): number => {
  // ICD-10 codes for diabetes
  const icd10Mapping: { [key: string]: number } = {
    E10: 1, // Type 1 diabetes
    E11: 2, // Type 2 diabetes
    E13: 2, // Other specified diabetes
    E14: 3, // Unspecified diabetes
    "R73.03": 4, // Pre-diabetes
    "R73.9": 4, // Hyperglycemia, unspecified (often pre-diabetes)
  };

  // SNOMED CT codes
  const snomedMapping: { [key: string]: number } = {
    "46635009": 1, // Type 1 diabetes
    "44054006": 2, // Type 2 diabetes
    "9414007": 2, // Secondary diabetes
    "73211009": 3, // Diabetes mellitus (unspecified)
    "15771004": 4, // Pre-diabetes
  };

  // Text-based mapping for condition descriptions
  const textMapping: { [key: string]: number } = {
    "type 1": 1,
    "type i": 1,
    iddm: 1,
    "insulin dependent": 1,
    "type 2": 2,
    "type ii": 2,
    niddm: 2,
    "non-insulin dependent": 2,
    "pre-diabetes": 4,
    prediabetes: 4,
    "impaired glucose": 4,
    gestational: 2, // Treat as type 2 for study purposes
  };

  // Check mappings in order of preference
  if (icd10Mapping[diabetesCode]) return icd10Mapping[diabetesCode];
  if (snomedMapping[diabetesCode]) return snomedMapping[diabetesCode];

  if (conditionText) {
    const lowerText = conditionText.toLowerCase();
    for (const [key, value] of Object.entries(textMapping)) {
      if (lowerText.includes(key)) return value;
    }
  }

  return 0; // No diabetes history
};

// ========================================
// HEART DISEASE MAPPINGS (FHIR Condition)
// ========================================

/**
 * Maps FHIR cardiovascular condition codes to ZK circuit values
 */
export const fhirHeartDiseaseToZK = (heartCode: string, conditionText?: string): number => {
  // ICD-10 codes for cardiovascular conditions
  const icd10Mapping: { [key: string]: number } = {
    I21: 1, // Acute myocardial infarction (heart attack)
    I22: 1, // Subsequent myocardial infarction
    I25: 2, // Chronic ischemic heart disease
    I50: 2, // Heart failure
    I20: 2, // Angina pectoris
    I42: 2, // Cardiomyopathy
    "Z87.891": 3, // Personal history of nicotine dependence (family history context)
  };

  // SNOMED CT codes
  const snomedMapping: { [key: string]: number } = {
    "22298006": 1, // Myocardial infarction
    "57054005": 1, // Acute myocardial infarction
    "194828000": 2, // Angina
    "84114007": 2, // Heart failure
    "53741008": 2, // Coronary arteriosclerosis
    "429559004": 3, // Typical angina (family history)
  };

  const textMapping: { [key: string]: number } = {
    "heart attack": 1,
    "myocardial infarction": 1,
    mi: 1,
    coronary: 2,
    angina: 2,
    "heart failure": 2,
    cardiomyopathy: 2,
    "family history": 3,
    "genetic risk": 3,
    current: 4,
    active: 4,
    ongoing: 4,
  };

  if (icd10Mapping[heartCode]) return icd10Mapping[heartCode];
  if (snomedMapping[heartCode]) return snomedMapping[heartCode];

  if (conditionText) {
    const lowerText = conditionText.toLowerCase();
    for (const [key, value] of Object.entries(textMapping)) {
      if (lowerText.includes(key)) return value;
    }
  }

  return 0; // No heart disease history
};

// ========================================
// ACTIVITY LEVEL MAPPINGS (FHIR Observation)
// ========================================

/**
 * Maps FHIR physical activity observations to ZK circuit values
 * Based on LOINC codes for physical activity assessments
 */
export const fhirActivityLevelToZK = (activityCode: string, value?: number): number => {
  // LOINC codes for physical activity
  const loincMapping = {
    "68516-4": (mins: number) => {
      // Exercise minutes per week
      if (mins < 30) return 1; // Sedentary
      if (mins < 150) return 2; // Lightly Active
      if (mins < 300) return 3; // Moderately Active
      if (mins < 420) return 4; // Very Active
      return 5; // Extremely Active
    },
    "89574-8": (steps: number) => {
      // Steps per day
      if (steps < 5000) return 1;
      if (steps < 7500) return 2;
      if (steps < 10000) return 3;
      if (steps < 12500) return 4;
      return 5;
    },
  };

  if (activityCode in loincMapping && value !== undefined) {
    return (loincMapping as any)[activityCode](value);
  }

  // Text-based activity level mapping
  const textMapping: { [key: string]: number } = {
    sedentary: 1,
    inactive: 1,
    low: 1,
    light: 2,
    mild: 2,
    occasional: 2,
    moderate: 3,
    regular: 3,
    average: 3,
    high: 4,
    vigorous: 4,
    frequent: 4,
    extreme: 5,
    intense: 5,
    athlete: 5,
  };

  // Check for text patterns if no LOINC code match
  if (activityCode) {
    const lowerCode = activityCode.toLowerCase();
    for (const [key, val] of Object.entries(textMapping)) {
      if (lowerCode.includes(key)) return val;
    }
  }

  return 3; // Default to moderate activity
};

// ========================================
// REGION/LOCATION MAPPINGS
// ========================================

/**
 * Maps FHIR address/location data to ZK circuit region values
 * Uses ISO country codes and regional groupings
 */
export const fhirLocationToZK = (country?: string, continent?: string, address?: any): number[] => {
  const countryToRegionMapping: { [key: string]: number } = {
    // North America (1)
    US: 1,
    CA: 1,
    MX: 1,
    // Europe (2)
    GB: 2,
    DE: 2,
    FR: 2,
    IT: 2,
    ES: 2,
    NL: 2,
    BE: 2,
    AT: 2,
    CH: 2,
    SE: 2,
    NO: 2,
    DK: 2,
    FI: 2,
    PL: 2,
    CZ: 2,
    HU: 2,
    IE: 2,
    PT: 2,
    // Asia (3)
    CN: 3,
    JP: 3,
    KR: 3,
    IN: 3,
    TH: 3,
    SG: 3,
    MY: 3,
    VN: 3,
    PH: 3,
    ID: 3,
    BD: 3,
    PK: 3,
    LK: 3,
    MM: 3,
    KH: 3,
    LA: 3,
    // South America (4)
    BR: 4,
    AR: 4,
    CL: 4,
    PE: 4,
    CO: 4,
    VE: 4,
    EC: 4,
    UY: 4,
    PY: 4,
    // Africa (5)
    ZA: 5,
    NG: 5,
    KE: 5,
    ET: 5,
    EG: 5,
    MA: 5,
    GH: 5,
    TN: 5,
    DZ: 5,
    // Oceania (6)
    AU: 6,
    NZ: 6,
    FJ: 6,
    PG: 6,
    NC: 6,
    VU: 6,
    SB: 6,
    // Middle East (7)
    SA: 7,
    AE: 7,
    IR: 7,
    IQ: 7,
    IL: 7,
    JO: 7,
    LB: 7,
    SY: 7,
    TR: 7,
    KW: 7,
    QA: 7,
    BH: 7,
    OM: 7,
    YE: 7,
    // Central America (8)
    GT: 8,
    BZ: 8,
    SV: 8,
    HN: 8,
    NI: 8,
    CR: 8,
    PA: 8,
  };

  const regions: number[] = [];

  if (country) {
    const region = countryToRegionMapping[country.toUpperCase()];
    if (region) regions.push(region);
  }

  // Parse FHIR Address resource if provided
  if (address?.country) {
    const region = countryToRegionMapping[address.country.toUpperCase()];
    if (region && !regions.includes(region)) regions.push(region);
  }

  return regions.length > 0 ? regions : [1]; // Default to North America
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate age from FHIR Patient.birthDate
 */
export const calculateAgeFromFHIR = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  return age;
};

/**
 * Extract numeric value from FHIR Observation
 */
export const extractObservationValue = (
  observation: any
): { value: number; unit: string } | null => {
  if (observation.valueQuantity) {
    return {
      value: observation.valueQuantity.value,
      unit: observation.valueQuantity.unit || observation.valueQuantity.code || "",
    };
  }

  if (observation.valueInteger !== undefined) {
    return { value: observation.valueInteger, unit: "" };
  }

  if (observation.valueDecimal !== undefined) {
    return { value: observation.valueDecimal, unit: "" };
  }

  return null;
};

/**
 * Main function to extract ZK-compatible values from FHIR resources
 */
export const extractZKValuesFromFHIR = (
  fhirResource: any
): Partial<{
  age: number;
  gender: number;
  bloodType: number;
  smokingStatus: number;
  activityLevel: number;
  diabetesStatus: number;
  heartDiseaseStatus: number;
  regions: number[];
  cholesterol: number;
  bmi: number;
  systolicBP: number;
  diastolicBP: number;
  hba1c: number;
}> => {
  const values: any = {};

  // Handle Patient resource
  if (fhirResource.resourceType === "Patient") {
    if (fhirResource.birthDate) {
      values.age = calculateAgeFromFHIR(fhirResource.birthDate);
    }
    if (fhirResource.gender) {
      values.gender = fhirGenderToZK(fhirResource.gender);
    }
    if (fhirResource.address) {
      values.regions = fhirLocationToZK(
        fhirResource.address[0]?.country,
        undefined,
        fhirResource.address[0]
      );
    }
  }

  // Handle Observation resource
  if (fhirResource.resourceType === "Observation") {
    const code = fhirResource.code?.coding?.[0]?.code;
    const obsValue = extractObservationValue(fhirResource);

    if (code && obsValue) {
      // Map common LOINC codes to our criteria
      switch (code) {
        case "2085-9": // Cholesterol, HDL
        case "2089-1": // Cholesterol, LDL
        case "14647-2": // Cholesterol, total
          values.cholesterol = obsValue.value;
          break;
        case "39156-5": // BMI
          values.bmi = obsValue.value;
          break;
        case "8480-6": // Systolic BP
          values.systolicBP = obsValue.value;
          break;
        case "8462-4": // Diastolic BP
          values.diastolicBP = obsValue.value;
          break;
        case "4548-4": // HbA1c
        case "17856-6": // HbA1c (IFCC)
          values.hba1c = obsValue.value;
          break;
        case "72166-2": // Tobacco smoking status
          values.smokingStatus = fhirSmokingStatusToZK(
            fhirResource.valueCodeableConcept?.coding?.[0]?.code || ""
          );
          break;
      }
    }
  }

  // Handle Condition resource
  if (fhirResource.resourceType === "Condition") {
    const code = fhirResource.code?.coding?.[0]?.code;
    const text = fhirResource.code?.text || fhirResource.code?.coding?.[0]?.display;

    if (code) {
      // Check for diabetes codes
      const diabetesResult = fhirDiabetesToZK(code, text);
      if (diabetesResult > 0) {
        values.diabetesStatus = diabetesResult;
      }

      // Check for heart disease codes
      const heartResult = fhirHeartDiseaseToZK(code, text);
      if (heartResult > 0) {
        values.heartDiseaseStatus = heartResult;
      }
    }
  }

  return values;
};

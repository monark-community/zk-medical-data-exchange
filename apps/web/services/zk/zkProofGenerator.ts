import { StudyCriteria, BinConfiguration, ExtractedMedicalData, getScaleFactorForMedicalDataField } from "@zk-medical/shared";
import { GENDER_VALUES } from "@/constants/medicalDataConstants";

// Import snarkjs for proof generation
// @ts-ignore - snarkjs doesn't have proper TypeScript definitions
import * as snarkjs from "snarkjs";
import {
  generateDataCommitment,
  generateSecureSalt,
} from "@/services/zk/commitmentGenerator";

export { generateDataCommitment, generateSecureSalt };

/**
 * ZK Proof structure expected by smart contract
 */
export interface ZKProof {
  a: [string, string]; // Groth16 proof point A (G1)
  b: [[string, string], [string, string]]; // Groth16 proof point B (G2)
  c: [string, string]; // Groth16 proof point C (G1)
}

/**
 * Result of ZK proof generation
 */
export interface ZKProofResult {
  proof: ZKProof;
  publicSignals: string[]; // Public outputs from the circuit
  isEligible: boolean; // Whether the patient is eligible
  binMembership?: {
    binIds: string[]; // Human-readable bin IDs
    numericBinIds: number[]; // Numeric bin IDs for blockchain
    binIndices: number[];
  };
}

/**
 * Circuit input structure matching medical_eligibility.circom
 */
interface CircuitInput {
  age: string;
  gender: string;
  region: string;
  cholesterol: string;
  bmi: string;
  systolicBP: string;
  diastolicBP: string;
  bloodType: string;
  hba1c: string;
  smokingStatus: string;
  activityLevel: string;
  diabetesStatus: string;
  heartDiseaseHistory: string;
  salt: string;

  dataCommitment: string;
  challenge: string;

  enableAge: string;
  minAge: string;
  maxAge: string;
  enableCholesterol: string;
  minCholesterol: string;
  maxCholesterol: string;
  enableBMI: string;
  minBMI: string;
  maxBMI: string;
  enableBloodType: string;
  allowedBloodTypes: string[]; // Array of 4 elements
  enableGender: string;
  allowedGender: string;
  enableLocation: string;
  allowedRegions: string[]; // Array of 4 elements
  enableBloodPressure: string;
  minSystolic: string;
  maxSystolic: string;
  minDiastolic: string;
  maxDiastolic: string;
  enableHbA1c: string;
  minHbA1c: string;
  maxHbA1c: string;
  enableSmoking: string;
  allowedSmoking: string;
  enableActivity: string;
  minActivityLevel: string;
  maxActivityLevel: string;
  enableDiabetes: string;
  allowedDiabetes: string;
  enableHeartDisease: string;
  allowedHeartDisease: string;
  numBins: string;
  binFieldCodes: string[];
  binTypes: string[];
  binMinValues: string[];
  binMaxValues: string[];
  binIncludeMin: string[];
  binIncludeMax: string[];
  binCategories: string[][];
  binCategoryCount: string[];
}

/**
 * Generates a ZK proof for medical data eligibility
 * This proves that the patient meets study criteria without revealing their medical data
 * 
 * Optionally includes bin membership computation if binConfiguration is provided
 *
 * @param medicalData - Patient's aggregated medical data
 * @param studyCriteria - Study eligibility criteria
 * @param dataCommitment - Poseidon hash of the medical data (prevents data manipulation)
 * @param salt - Random salt used in commitment (from generateSecureSalt())
 * @param binConfiguration - Optional bin configuration for studies with bins
 * @returns ZK proof and public signals (including bin membership if applicable)
 *
 */
export const generateZKProof = async (
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  salt: number,
  challenge: string,
  binConfiguration?: BinConfiguration
): Promise<ZKProofResult> => {
  try {
    console.log("Data commitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("Salt:", salt);
    console.log("Challenge:", challenge);
    console.log("Bin configuration:", binConfiguration);

    if (!dataCommitment) {
      throw new Error("dataCommitment is required but was undefined");
    }
    if (salt === undefined || salt === null) {
      throw new Error("salt is required but was undefined");
    }
    const circuitInput = prepareCircuitInput(
      medicalData, 
      studyCriteria, 
      dataCommitment, 
      salt, 
      challenge,
      binConfiguration
    );
    console.log("Circuit input prepared with commitment verification");

    console.log("Loading circuit files...");
    const circuitWasm = await loadCircuitWasm();
    const provingKey = await loadProvingKey();
    console.log(
      "Both files loaded. circuitWasm type:",
      typeof circuitWasm,
      "| provingKey type:",
      typeof provingKey
    );

    console.log("Generating ZK proof");
    console.log("Calling snarkjs.groth16.fullProve with inputs");
    console.log("├─ circuitInput:", circuitInput);
    console.log("├─ circuitWasm type:", typeof circuitWasm);
    console.log("└─ provingKey type:", typeof provingKey);

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      circuitWasm,
      provingKey
    );

    const formattedProof: ZKProof = {
      a: [
        proof.pi_a[0].toString(),
        proof.pi_a[1].toString(),
      ],
      b: [
        [
          proof.pi_b[0][1].toString(),
          proof.pi_b[0][0].toString(),
        ],
        [
          proof.pi_b[1][1].toString(),
          proof.pi_b[1][0].toString(),
        ],
      ],
      c: [
        proof.pi_c[0].toString(),
        proof.pi_c[1].toString(),
      ],
    };

    console.log("ZK proof generated successfully!");
    console.log("Public signals:", publicSignals);

    let binMembershipInfo;
    if (binConfiguration?.bins && binConfiguration.bins.length > 0) {
      binMembershipInfo = extractBinMembershipFromProof(publicSignals, binConfiguration);
    }

    return {
      proof: formattedProof,
      publicSignals: publicSignals.map((signal: any) => signal.toString()),
      isEligible: true,
      binMembership: binMembershipInfo,
    };
  } catch (error) {
    console.error("ZK proof generation failed:", error);
    throw new Error("Privacy verification system unavailable. Please ensure you have uploaded all required medical data and try again.");
  }
};

/**
 * Prepare circuit input from medical data and study criteria
 *
 * @param medicalData - Patient's extracted medical data
 * @param studyCriteria - Study eligibility criteria (determines which fields are required)
 * @param dataCommitment - Poseidon commitment of the medical data (for verification)
 * @param salt - Random salt used in the commitment (number from generateSecureSalt())
 * @param binConfiguration - Optional bin configuration for bin membership computation
 */
function prepareCircuitInput(
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  salt: number,
  challenge: string,
  binConfiguration?: BinConfiguration
): CircuitInput {
    console.log("Preparing circuit input...");
    console.log("├─ dataCommitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("├─ salt:", salt);
    console.log("├─ medicalData (raw):", medicalData);
    console.log("├─ challenge:", challenge);
    console.log("└─ studyCriteria:", studyCriteria);

  return {
    age: medicalData.age.toString(),
    gender: medicalData.gender.toString(),
    bmi: medicalData.bmi.toString(),
    smokingStatus: medicalData.smokingStatus.toString(),
    region: medicalData.regions[0].toString(),
    cholesterol: medicalData.cholesterol.toString(),
    systolicBP: medicalData.systolicBP.toString(),
    diastolicBP: medicalData.diastolicBP.toString(),
    bloodType: medicalData.bloodType.toString(),
    hba1c: medicalData.hba1c.toString(),
    activityLevel: medicalData.activityLevel.toString(),
    diabetesStatus: medicalData.diabetesStatus.toString(),
    heartDiseaseHistory: medicalData.heartDiseaseStatus.toString(),

    salt: salt.toString(),
    dataCommitment: dataCommitment.toString(),
    challenge: (challenge.startsWith('0x') ? BigInt(challenge) : BigInt(`0x${challenge}`)).toString(),
    enableAge: studyCriteria.enableAge.toString(),
    minAge: studyCriteria.minAge.toString(),
    maxAge: studyCriteria.maxAge.toString(),
    enableCholesterol: studyCriteria.enableCholesterol.toString(),
    minCholesterol: studyCriteria.minCholesterol.toString(),
    maxCholesterol: studyCriteria.maxCholesterol.toString(),
    enableBMI: studyCriteria.enableBMI.toString(),
    minBMI: studyCriteria.minBMI.toString(),
    maxBMI: studyCriteria.maxBMI.toString(),
    enableBloodType: studyCriteria.enableBloodType.toString(),
    allowedBloodTypes: studyCriteria.allowedBloodTypes.map((v) => v.toString()),
    enableGender: studyCriteria.enableGender.toString(),
    allowedGender: studyCriteria.allowedGender.toString(),
    enableLocation: studyCriteria.enableLocation.toString(),
    allowedRegions: studyCriteria.allowedRegions.map((v) => v.toString()),
    enableBloodPressure: studyCriteria.enableBloodPressure.toString(),
    minSystolic: studyCriteria.minSystolic.toString(),
    maxSystolic: studyCriteria.maxSystolic.toString(),
    minDiastolic: studyCriteria.minDiastolic.toString(),
    maxDiastolic: studyCriteria.maxDiastolic.toString(),
    enableHbA1c: studyCriteria.enableHbA1c.toString(),
    minHbA1c: studyCriteria.minHbA1c.toString(),
    maxHbA1c: studyCriteria.maxHbA1c.toString(),
    enableSmoking: studyCriteria.enableSmoking.toString(),
    allowedSmoking: studyCriteria.allowedSmoking.toString(),
    enableActivity: studyCriteria.enableActivity.toString(),
    minActivityLevel: studyCriteria.minActivityLevel.toString(),
    maxActivityLevel: studyCriteria.maxActivityLevel.toString(),
    enableDiabetes: studyCriteria.enableDiabetes.toString(),
    allowedDiabetes: studyCriteria.allowedDiabetes.toString(),
    enableHeartDisease: studyCriteria.enableHeartDisease.toString(),
    allowedHeartDisease: studyCriteria.allowedHeartDisease.toString(),
    ...prepareBinInputs(binConfiguration),
  };
}

/**
 * Prepare bin-related circuit inputs
 * Returns zero-filled arrays if no bin configuration provided
 */
function prepareBinInputs(binConfiguration?: BinConfiguration) {
  const MAX_BINS = 50;
  const MAX_CATEGORIES_PER_BIN = 10;
  
  const binFieldCodes = new Array(MAX_BINS).fill(0);
  const binTypes = new Array(MAX_BINS).fill(0);
  const binMinValues = new Array(MAX_BINS).fill(0);
  const binMaxValues = new Array(MAX_BINS).fill(0);
  const binIncludeMin = new Array(MAX_BINS).fill(0);
  const binIncludeMax = new Array(MAX_BINS).fill(0);
  const binCategories = Array.from({ length: MAX_BINS }, () => 
    new Array(MAX_CATEGORIES_PER_BIN).fill(0)
  );
  const binCategoryCount = new Array(MAX_BINS).fill(0);
  
  const numBins = binConfiguration?.bins?.length ?? 0;
  
  if (binConfiguration?.bins) {
    binConfiguration.bins.forEach((bin, i) => {
      if (i >= MAX_BINS) {
        console.warn(`Warning: Bin index ${i} exceeds MAX_BINS (${MAX_BINS}), skipping`);
        return;
      }
      
      const fieldCode = getFieldCode(bin.criteriaField);
      binFieldCodes[i] = fieldCode;
      binTypes[i] = bin.type === "RANGE" ? 0 : 1;
      
      if (bin.type === "RANGE") {
        const scaleFactor = getScaleFactorForFieldCode(fieldCode);
        binMinValues[i] = Math.round((bin.minValue ?? 0) * scaleFactor);
        binMaxValues[i] = Math.round((bin.maxValue ?? 0) * scaleFactor);
        binIncludeMin[i] = bin.includeMin ? 1 : 0;
        binIncludeMax[i] = bin.includeMax ? 1 : 0;
      } else {
        const categories = bin.categories ?? [];
        binCategoryCount[i] = Math.min(categories.length, MAX_CATEGORIES_PER_BIN);
        
        categories.forEach((cat, j) => {
          if (j < MAX_CATEGORIES_PER_BIN) {
            binCategories[i][j] = cat;
          }
        });
      }
    });
  }
  
  return {
    numBins: numBins.toString(),
    binFieldCodes: binFieldCodes.map(String),
    binTypes: binTypes.map(String),
    binMinValues: binMinValues.map(String),
    binMaxValues: binMaxValues.map(String),
    binIncludeMin: binIncludeMin.map(String),
    binIncludeMax: binIncludeMax.map(String),
    binCategories: binCategories.map(row => row.map(String)),
    binCategoryCount: binCategoryCount.map(String),
  };
}

/**
 * Map field names to circuit field codes
 * 0=age, 1=gender, 2=region, 3=cholesterol, 4=bmi, 5=systolicBP,
 * 6=diastolicBP, 7=bloodType, 8=hba1c, 9=smokingStatus, 10=activityLevel,
 * 11=diabetesStatus, 12=heartDiseaseHistory
 */
function getFieldCode(fieldName: string): number {
  const fieldMap: Record<string, number> = {
    age: 0,
    gender: 1,
    region: 2,
    cholesterol: 3,
    bmi: 4,
    systolicBP: 5,
    diastolicBP: 6,
    bloodType: 7,
    hba1c: 8,
    smokingStatus: 9,
    activityLevel: 10,
    diabetesStatus: 11,
    heartDisease: 12,
  };
  
  const code = fieldMap[fieldName];
  if (code === undefined) {
    console.warn(`Unknown field: ${fieldName}, defaulting to 0`);
    return 0;
  }
  
  return code;
}

/**
 * Get scale factor for a field code
 * Returns the factor to scale bin boundaries for comparison with scaled medical data
 */
function getScaleFactorForFieldCode(fieldCode: number): number {
  const fieldCodeToName: Record<number, string> = {
    0: 'age',
    3: 'cholesterol', 
    4: 'bmi',
    5: 'systolicBP',
    6: 'diastolicBP',
    8: 'hba1c',
  };
  
  const fieldName = fieldCodeToName[fieldCode];
  if (!fieldName) {
    return 1; 
  }
  
  return getScaleFactorForMedicalDataField(fieldName);
}

/**
 * Extract bin membership from proof's public signals
 */
function extractBinMembershipFromProof(
  publicSignals: any[],
  binConfiguration: BinConfiguration
): { binIds: string[]; numericBinIds: number[]; binIndices: number[] } {
  const binIds: string[] = [];
  const numericBinIds: number[] = [];
  const binIndices: number[] = [];

  for (let i = 0; i < binConfiguration.bins.length; i++) {
    const binFlag = publicSignals[3 + i];

    if (binFlag === "1" || binFlag === 1) {
      binIds.push(binConfiguration.bins[i].id);
      numericBinIds.push(binConfiguration.bins[i].numericId);
      binIndices.push(i);
    }
  }

  return { binIds, numericBinIds, binIndices };
}

/**
 * Validation result with detailed failure information
 */
interface ValidationResult {
  isValid: boolean;
  fieldName?: string;
  reason?: string;
}

/**
 * Check if a required field has a value
 */
function validateRequiredField<T>(value: T | undefined, fieldName: string): ValidationResult {
  if (value === undefined) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} data missing but required by study`,
    };
  }
  return { isValid: true };
}

/**
 * Check if a numeric value is within a range
 */
function validateNumericRange(
  value: number | undefined,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const requiredCheck = validateRequiredField(value, fieldName);
  if (!requiredCheck.isValid) return requiredCheck;

  if (value! < min || value! > max) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} ${value} not in range ${min}-${max}`,
    };
  }
  return { isValid: true };
}

/**
 * Check if a value matches the expected value
 */
function validateExactMatch<T>(
  value: T | undefined,
  expected: T,
  fieldName: string
): ValidationResult {
  const requiredCheck = validateRequiredField(value, fieldName);
  if (!requiredCheck.isValid) return requiredCheck;

  if (value !== expected) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} does not match required value`,
    };
  }
  return { isValid: true };
}

/**
 * Check if a value is in an allowed list
 */
function validateInList<T>(
  value: T | undefined,
  allowedValues: readonly T[],
  fieldName: string
): ValidationResult {
  const requiredCheck = validateRequiredField(value, fieldName);
  if (!requiredCheck.isValid) return requiredCheck;

  if (!allowedValues.includes(value!)) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} not in allowed values`,
    };
  }
  return { isValid: true };
}

/**
 * Check if arrays have overlapping elements
 */
function validateArrayOverlap<T>(
  values: readonly T[] | undefined,
  allowedValues: readonly T[],
  fieldName: string
): ValidationResult {
  if (!values || values.length === 0) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} data missing but required by study`,
    };
  }

  const hasMatch = values.some((value) => allowedValues.includes(value));
  if (!hasMatch) {
    return {
      isValid: false,
      fieldName,
      reason: `${fieldName} does not match any allowed values`,
    };
  }
  return { isValid: true };
}

/**
 * Check eligibility locally before generating expensive proof
 *
 * @param medicalData - Patient's medical data
 * @param studyCriteria - Study eligibility criteria
 * @returns true if eligible, false otherwise
 */
export function checkEligibility(
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria
): boolean {
  const scaledHbA1c = medicalData.hba1c;
  const scaledBMI = medicalData.bmi;

  const validations: Array<{ enabled: boolean; check: () => ValidationResult }> = [
    {
      enabled: Boolean(studyCriteria.enableAge),
      check: () =>
        validateNumericRange(medicalData.age, studyCriteria.minAge, studyCriteria.maxAge, "Age"),
    },
    {
      enabled: Boolean(studyCriteria.enableGender),
      check: () => {
        if (studyCriteria.allowedGender === GENDER_VALUES.ANY) {
          return { isValid: true };
        }
        return validateExactMatch(medicalData.gender, studyCriteria.allowedGender, "Gender");
      },
    },
    {
      enabled: Boolean(studyCriteria.enableLocation),
      check: () =>
        validateArrayOverlap(medicalData.regions, studyCriteria.allowedRegions, "Location"),
    },
    {
      enabled: Boolean(studyCriteria.enableCholesterol),
      check: () =>
        validateNumericRange(
          medicalData.cholesterol,
          studyCriteria.minCholesterol,
          studyCriteria.maxCholesterol,
          "Cholesterol"
        ),
    },
    {
      enabled: Boolean(studyCriteria.enableBMI),
      check: () =>
        validateNumericRange(scaledBMI, studyCriteria.minBMI, studyCriteria.maxBMI, "BMI"),
    },
    {
      enabled: Boolean(studyCriteria.enableBloodPressure),
      check: () => {
        const systolicCheck = validateRequiredField(medicalData.systolicBP, "Systolic BP");
        if (!systolicCheck.isValid) return systolicCheck;

        const diastolicCheck = validateRequiredField(medicalData.diastolicBP, "Diastolic BP");
        if (!diastolicCheck.isValid) return diastolicCheck;

        if (
          medicalData.systolicBP! < studyCriteria.minSystolic ||
          medicalData.systolicBP! > studyCriteria.maxSystolic ||
          medicalData.diastolicBP! < studyCriteria.minDiastolic ||
          medicalData.diastolicBP! > studyCriteria.maxDiastolic
        ) {
          return {
            isValid: false,
            fieldName: "Blood Pressure",
            reason: "Blood pressure out of acceptable range",
          };
        }
        return { isValid: true };
      },
    },
    {
      enabled: Boolean(studyCriteria.enableBloodType),
      check: () =>
        validateInList(medicalData.bloodType, studyCriteria.allowedBloodTypes, "Blood Type"),
    },
    {
      enabled: Boolean(studyCriteria.enableHbA1c),
      check: () =>
        validateNumericRange(scaledHbA1c, studyCriteria.minHbA1c, studyCriteria.maxHbA1c, "HbA1c"),
    },
    {
      enabled: Boolean(studyCriteria.enableSmoking),
      check: () =>
        validateExactMatch(
          medicalData.smokingStatus,
          studyCriteria.allowedSmoking,
          "Smoking status"
        ),
    },
    {
      enabled: Boolean(studyCriteria.enableActivity),
      check: () =>
        validateNumericRange(
          medicalData.activityLevel,
          studyCriteria.minActivityLevel,
          studyCriteria.maxActivityLevel,
          "Activity level"
        ),
    },
    {
      enabled: Boolean(studyCriteria.enableDiabetes),
      check: () =>
        validateExactMatch(
          medicalData.diabetesStatus,
          studyCriteria.allowedDiabetes,
          "Diabetes status"
        ),
    },
    {
      enabled: Boolean(studyCriteria.enableHeartDisease),
      check: () =>
        validateExactMatch(
          medicalData.heartDiseaseStatus,
          studyCriteria.allowedHeartDisease,
          "Heart disease history"
        ),
    },
  ];

  for (const validation of validations) {
    if (validation.enabled) {
      const result = validation.check();
      if (!result.isValid) {
        console.log(`${result.fieldName} check failed:`, result.reason);
        return false;
      }
    }
  }

  console.log("All eligibility checks passed!");
  return true;
}

/**
 * Load circuit WASM file from public directory
 * The WASM file contains the compiled circuit logic
 */
async function loadCircuitWasm(): Promise<Uint8Array> {
  console.log("Loading circuit.wasm...");

  try {
    const response = await fetch("/circuits/medical_eligibility.wasm");
    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to load circuit WASM: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log(
      "Circuit WASM loaded successfully:",
      (uint8Array.byteLength / 1024).toFixed(2),
      "KB"
    );
    console.log(
      "Circuit WASM type:",
      uint8Array.constructor.name,
      "| Is Uint8Array:",
      uint8Array instanceof Uint8Array
    );

    return uint8Array;
  } catch (error) {
    console.error("Failed to load circuit WASM:", error);
    throw new Error(
      `Failed to load circuit WASM file.\n` +
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Load proving key (zkey) from public directory
 * The proving key is used to generate the ZK proof
 */
async function loadProvingKey(): Promise<Uint8Array> {
  console.log("Loading proving key...");

  try {
    const response = await fetch("/circuits/medical_eligibility_0001.zkey");

    if (!response.ok) {
      throw new Error(`Failed to load proving key: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log(
      "Proving key loaded successfully:",
      (uint8Array.byteLength / 1024 / 1024).toFixed(2),
      "MB"
    );
    console.log(
      "Proving key type:",
      uint8Array.constructor.name,
      "| Is Uint8Array:",
      uint8Array instanceof Uint8Array
    );

    return uint8Array;
  } catch (error) {
    console.error("Failed to load proving key:", error);
    throw new Error(
      `Failed to load proving key file.\n` +
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
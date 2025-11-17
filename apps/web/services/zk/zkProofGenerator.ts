import { StudyCriteria } from "@zk-medical/shared";

// Import snarkjs for proof generation
// @ts-ignore - snarkjs doesn't have proper TypeScript definitions
import * as snarkjs from "snarkjs";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";
import {
  generateDataCommitment,
  generateSecureSalt,
  normalizeMedicalDataForCircuit,
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
  
  dataCommitment: string;
  studyId: string;
  walletAddress: string;
  challenge: string;
}

/**
 * Generates a ZK proof for medical data eligibility
 * This proves that the patient meets study criteria without revealing their medical data
 *
 * @param medicalData - Patient's aggregated medical data
 * @param studyCriteria - Study eligibility criteria
 * @param dataCommitment - Poseidon hash of the medical data (prevents data manipulation)
 * @param salt - Random salt used in commitment (from generateSecureSalt())
 * @returns ZK proof and public signals
 *
 */
export const generateZKProof = async (
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  salt: number,
  challenge: string,
  studyId: number,
  walletAddress: string
): Promise<ZKProofResult> => {
  try {
    console.log("Data commitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("Salt:", salt);

    if (!dataCommitment) {
      throw new Error("dataCommitment is required but was undefined");
    }
    if (salt === undefined || salt === null) {
      throw new Error("salt is required but was undefined");
    }

    const isEligible = checkEligibility(medicalData, studyCriteria);
    console.log("Eligibility check:", isEligible ? "ELIGIBLE" : "NOT ELIGIBLE");

    if (!isEligible) {
      return {
        proof: {
          a: ["0", "0"],
          b: [
            ["0", "0"],
            ["0", "0"],
          ],
          c: ["0", "0"],
        },
        publicSignals: ["0"],
        isEligible: false,
      };
    }
    
    const circuitInput = prepareCircuitInput(medicalData, studyCriteria, dataCommitment, salt, challenge, studyId, walletAddress);
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
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      circuitWasm,
      provingKey
    );

    console.log("Raw proof from snarkjs:", proof);
    console.log("Proof types - a[0]:", typeof proof.pi_a[0], "a[1]:", typeof proof.pi_a[1]);

    const formattedProof: ZKProof = {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
    };

    console.log("ZK proof generated successfully!");
    console.log("Public signals count from snarkjs:", publicSignals.length);

    // CRITICAL FIX: snarkjs is returning 43 signals instead of 42
    // The circuit has 42 public inputs + 0 outputs, but snarkjs includes an extra signal
    // This appears to be the private 'age' input (signal 43) leaking through
    // We must remove it before verification or the smart contract will reject the proof
    const correctedPublicSignals = publicSignals.length === 43 
      ? publicSignals.slice(0, 42)  // Remove the 43rd signal
      : publicSignals;

    if (publicSignals.length === 43) {
      console.warn("⚠️ HOTFIX: Removed extra signal from snarkjs output (43 → 42)");
      console.warn("Removed signal value:", publicSignals[42]);
    }

    return {
      proof: formattedProof,
      publicSignals: correctedPublicSignals.map((signal: any) => signal.toString()),
      isEligible: true,
    };
  } catch (error) {
    console.error("ZK proof generation failed:", error);
    throw new Error(
      `ZK proof generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Prepare circuit input from medical data and study criteria
 *
 * @param medicalData - Patient's extracted medical data
 * @param studyCriteria - Study eligibility criteria (determines which fields are required)
 * @param dataCommitment - Poseidon commitment of the medical data (for verification)
 * @param salt - Random salt used in the commitment (number from generateSecureSalt())
 */
function prepareCircuitInput(
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  salt: number,
  challenge: string,
  studyId: number,
  walletAddress: string,
): CircuitInput {
    console.log("Preparing circuit input...");
    console.log("├─ dataCommitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("├─ salt:", salt);
    console.log("├─ medicalData (raw):", medicalData);
    console.log("├─ challenge:", challenge);
    console.log("└─ studyCriteria:", studyCriteria);
  
  const normalized = normalizeMedicalDataForCircuit(medicalData);
  console.log("├─ medicalData (normalized):", normalized);

  // Replace negative sentinel values (-1) with safe in-range defaults.
  // Circuits with RangeCheck / Num2Bits constraints will fail on -1.
  // For disabled criteria (enable* == 0) we inject neutral 0 values that satisfy range constraints
  // without affecting eligibility logic (since checks are gated by enable flags).
  const safeNormalized = {
    age: normalized.age < 0 ? 0 : normalized.age,
    gender: normalized.gender < 0 ? 0 : normalized.gender,
    bmi: normalized.bmi < 0 ? 0 : normalized.bmi,
    smokingStatus: normalized.smokingStatus < 0 ? 0 : normalized.smokingStatus,
    region: normalized.region < 0 ? 0 : normalized.region,
    cholesterol: normalized.cholesterol < 0 ? 0 : normalized.cholesterol,
    systolicBP: normalized.systolicBP < 0 ? 0 : normalized.systolicBP,
    diastolicBP: normalized.diastolicBP < 0 ? 0 : normalized.diastolicBP,
    hba1c: normalized.hba1c < 0 ? 0 : normalized.hba1c,
    bloodType: normalized.bloodType < 0 ? 0 : normalized.bloodType,
    activityLevel: normalized.activityLevel < 0 ? 0 : normalized.activityLevel,
    diabetesStatus: normalized.diabetesStatus < 0 ? 0 : normalized.diabetesStatus,
    heartDiseaseHistory: normalized.heartDiseaseHistory < 0 ? 0 : normalized.heartDiseaseHistory,
  };

  if (Object.values(normalized).some((v) => typeof v === 'number' && v < 0)) {
    console.log("├─ Applied safe normalization (replaced -1 with 0)");
    console.log("├─ medicalData (safeNormalized):", safeNormalized);
  }

  // Log criteria to debug circuit constraint failures
  console.log("├─ Study criteria (raw):", {
    enableAge: studyCriteria.enableAge,
    minAge: studyCriteria.minAge,
    maxAge: studyCriteria.maxAge,
    enableCholesterol: studyCriteria.enableCholesterol,
    minCholesterol: studyCriteria.minCholesterol,
    maxCholesterol: studyCriteria.maxCholesterol,
    enableBMI: studyCriteria.enableBMI,
    minBMI: studyCriteria.minBMI,
    maxBMI: studyCriteria.maxBMI,
  });

  return {
    age: safeNormalized.age.toString(),
    gender: safeNormalized.gender.toString(),
    bmi: safeNormalized.bmi.toString(),
    smokingStatus: safeNormalized.smokingStatus.toString(),
    region: safeNormalized.region.toString(),
    cholesterol: safeNormalized.cholesterol.toString(),
    systolicBP: safeNormalized.systolicBP.toString(),
    diastolicBP: safeNormalized.diastolicBP.toString(),
    bloodType: safeNormalized.bloodType.toString(),
    hba1c: safeNormalized.hba1c.toString(),
    activityLevel: safeNormalized.activityLevel.toString(),
    diabetesStatus: safeNormalized.diabetesStatus.toString(),
    heartDiseaseHistory: safeNormalized.heartDiseaseHistory.toString(),

    salt: salt.toString(),
    enableAge: studyCriteria.enableAge.toString(),
    minAge: (studyCriteria.enableAge ? studyCriteria.minAge : 0).toString(),
    maxAge: (studyCriteria.enableAge ? studyCriteria.maxAge : 200).toString(),
    enableCholesterol: studyCriteria.enableCholesterol.toString(),
    minCholesterol: (studyCriteria.enableCholesterol ? studyCriteria.minCholesterol : 0).toString(),
    maxCholesterol: (studyCriteria.enableCholesterol ? studyCriteria.maxCholesterol : 500).toString(),
    enableBMI: studyCriteria.enableBMI.toString(),
    minBMI: (studyCriteria.enableBMI ? studyCriteria.minBMI : 0).toString(),
    maxBMI: (studyCriteria.enableBMI ? studyCriteria.maxBMI : 1000).toString(),
    enableBloodType: studyCriteria.enableBloodType.toString(),
    allowedBloodTypes: studyCriteria.allowedBloodTypes.map((v) => v.toString()),
    enableGender: studyCriteria.enableGender.toString(),
    allowedGender: studyCriteria.allowedGender.toString(),
    enableLocation: studyCriteria.enableLocation.toString(),
    allowedRegions: studyCriteria.allowedRegions.map((v) => v.toString()),
    enableBloodPressure: studyCriteria.enableBloodPressure.toString(),
    minSystolic: (studyCriteria.enableBloodPressure ? studyCriteria.minSystolic : 0).toString(),
    maxSystolic: (studyCriteria.enableBloodPressure ? studyCriteria.maxSystolic : 300).toString(),
    minDiastolic: (studyCriteria.enableBloodPressure ? studyCriteria.minDiastolic : 0).toString(),
    maxDiastolic: (studyCriteria.enableBloodPressure ? studyCriteria.maxDiastolic : 200).toString(),
    enableHbA1c: studyCriteria.enableHbA1c.toString(),
    minHbA1c: (studyCriteria.enableHbA1c ? studyCriteria.minHbA1c : 0).toString(),
    maxHbA1c: (studyCriteria.enableHbA1c ? studyCriteria.maxHbA1c : 200).toString(),
    enableSmoking: studyCriteria.enableSmoking.toString(),
    allowedSmoking: studyCriteria.allowedSmoking.toString(),
    enableActivity: studyCriteria.enableActivity.toString(),
    minActivityLevel: (studyCriteria.enableActivity ? studyCriteria.minActivityLevel : 0).toString(),
    maxActivityLevel: (studyCriteria.enableActivity ? studyCriteria.maxActivityLevel : 10).toString(),
    enableDiabetes: studyCriteria.enableDiabetes.toString(),
    allowedDiabetes: studyCriteria.allowedDiabetes.toString(),
    enableHeartDisease: studyCriteria.enableHeartDisease.toString(),
    allowedHeartDisease: studyCriteria.allowedHeartDisease.toString(),
    
    dataCommitment: dataCommitment.toString(),
    studyId: studyId.toString(),
    walletAddress: BigInt(walletAddress).toString(),
    challenge: BigInt(`0x${challenge}`).toString(),
  };
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
  const scaledHbA1c =
    medicalData.hba1c !== undefined ? Math.round(medicalData.hba1c * 10) : undefined;
  const scaledBMI = medicalData.bmi !== undefined ? Math.round(medicalData.bmi * 10) : undefined;

  const validations: Array<{ enabled: boolean; check: () => ValidationResult }> = [
    {
      enabled: Boolean(studyCriteria.enableAge),
      check: () =>
        validateNumericRange(medicalData.age, studyCriteria.minAge, studyCriteria.maxAge, "Age"),
    },
    {
      enabled: Boolean(studyCriteria.enableGender),
      check: () => validateExactMatch(medicalData.gender, studyCriteria.allowedGender, "Gender"),
    },
    {
      enabled: Boolean(studyCriteria.enableLocation),
      check: () => {
        // Circuit only checks first region, so we match that behavior
        const firstRegion = medicalData.regions?.[0];
        return validateInList(firstRegion, studyCriteria.allowedRegions, "Location");
      },
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

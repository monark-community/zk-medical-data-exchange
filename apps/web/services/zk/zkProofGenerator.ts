/**
 * ZK Proof Generator Service
 * Handles zero-knowledge proof generation for medical data eligibility
 */

import { StudyCriteria } from "@zk-medical/shared";

// Import snarkjs for proof generation
// @ts-ignore - snarkjs doesn't have proper TypeScript definitions
import * as snarkjs from "snarkjs";
import { ExtractedMedicalData } from "../fhir/types/extractedMedicalData";
import { generateDataCommitment, generateSecureSalt, normalizeMedicalDataForCircuit } from "./commitmentGenerator";

// Re-export commitment functions for convenience
export { generateDataCommitment, generateSecureSalt };

/**
 * ZK Proof structure expected by smart contract
 */
export interface ZKProof {
  a: [string, string];      // Groth16 proof point A (G1)
  b: [[string, string], [string, string]]; // Groth16 proof point B (G2)
  c: [string, string];      // Groth16 proof point C (G1)
}

/**
 * Result of ZK proof generation
 */
export interface ZKProofResult {
  proof: ZKProof;
  publicSignals: string[];  // Public outputs from the circuit
  isEligible: boolean;      // Whether the patient is eligible
}

/**
 * Circuit input structure matching medical_eligibility.circom
 */
interface CircuitInput {
  // Private inputs (patient's medical data)
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
  
  // Public input (commitment verification)
  dataCommitment: string;
  
  // Study criteria (private inputs to circuit)
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
  allowedBloodTypes: string[];  // Array of 4 elements
  enableGender: string;
  allowedGender: string;
  enableLocation: string;
  allowedRegions: string[];  // Array of 4 elements
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
 * SECURITY: The dataCommitment parameter is critical for preventing gaming attacks.
 * Workflow:
 * 1. Patient computes commitment = generateDataCommitment(medicalData, salt)
 * 2. Commitment is stored on-chain BEFORE study criteria are revealed
 * 3. Patient generates proof using original data + criteria
 * 4. ZK circuit verifies proof uses data matching the commitment
 * 5. Smart contract verifies proof AND checks commitment matches stored value
 * 
 * This prevents:
 * - Patients modifying data after seeing criteria
 * - Researchers tailoring criteria to specific patients
 * - Data shopping (trying multiple criteria until one matches)
 */
export const generateZKProof = async (
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  salt: number
): Promise<ZKProofResult> => {
  try {
    console.log("🔧 Starting ZK proof generation...");
    console.log("🔒 Data commitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("🎲 Salt:", salt);
    
    // Validate required parameters
    if (!dataCommitment) {
      throw new Error("dataCommitment is required but was undefined");
    }
    if (salt === undefined || salt === null) {
      throw new Error("salt is required but was undefined");
    }


    // Step 1: Check eligibility locally (fast feedback, saves compute if not eligible)
    const isEligible = checkEligibility(medicalData, studyCriteria);
    console.log("✅ Eligibility check:", isEligible ? "ELIGIBLE" : "NOT ELIGIBLE");
    
    if (!isEligible) {
      return {
        proof: {
          a: ["0", "0"],
          b: [["0", "0"], ["0", "0"]],
          c: ["0", "0"]
        },
        publicSignals: ["0"],
        isEligible: false
      };
    }
    
    // Step 2: Prepare circuit input (includes commitment data)
    const circuitInput = prepareCircuitInput(medicalData, studyCriteria, dataCommitment, salt);
    console.log("📋 Circuit input prepared with commitment verification");
    
    // Step 3: Load circuit files
    console.log("📁 Loading circuit files...");
    const circuitWasm = await loadCircuitWasm();
    const provingKey = await loadProvingKey();
    console.log("✅ Both files loaded. circuitWasm type:", typeof circuitWasm, "| provingKey type:", typeof provingKey);
    
    // Step 4: Generate the actual ZK proof using snarkjs
    console.log("⚡ Generating ZK proof (this may take 10-30 seconds)...");
    console.log("⚡ Calling snarkjs.groth16.fullProve with inputs...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      circuitWasm,
      provingKey
    );
    
    console.log("📋 Raw proof from snarkjs:", proof);
    console.log("📋 Proof types - a[0]:", typeof proof.pi_a[0], "a[1]:", typeof proof.pi_a[1]);
    
    const formattedProof: ZKProof = {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      c: [proof.pi_c[0], proof.pi_c[1]]
    };
    
    console.log("✅ ZK proof generated successfully!");
    console.log("📤 Public signals:", publicSignals);
    
    return {
      proof: formattedProof,
      publicSignals: publicSignals.map((signal: any) => signal.toString()),
      isEligible: true
    };
    
  } catch (error) {
    console.error("❌ ZK proof generation failed:", error);
    throw new Error(`ZK proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Prepare circuit input from medical data and study criteria
 * 
 * IMPORTANT: This function assumes checkEligibility() has already been called
 * and passed. Fields are required conditionally based on which study criteria
 * are enabled. If a required field (based on enabled criteria) is missing, this
 * will throw an error.
 * 
 * For disabled criteria, missing fields default to 0 (sentinel value).
 * Never use default values for enabled criteria - this creates security vulnerabilities!
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
  salt: number
): CircuitInput {
    console.log("🔧 Preparing circuit input...");
    console.log("├─ dataCommitment:", dataCommitment?.toString() || 'UNDEFINED');
    console.log("├─ salt:", salt);
    console.log("├─ medicalData (raw):", medicalData);
    console.log("└─ studyCriteria:", studyCriteria);
  
  // Use the same normalization as commitment generation to ensure consistency
  const normalized = normalizeMedicalDataForCircuit(medicalData);
  console.log("├─ medicalData (normalized):", normalized);

  return {
    // Normalized medical data (already scaled: BMI * 10, HbA1c * 10)
    age: normalized.age.toString(),
    gender: normalized.gender.toString(),
    bmi: normalized.bmi.toString(),
    smokingStatus: normalized.smokingStatus.toString(),
    region: normalized.region.toString(),
    cholesterol: normalized.cholesterol.toString(),
    systolicBP: normalized.systolicBP.toString(),
    diastolicBP: normalized.diastolicBP.toString(),
    bloodType: normalized.bloodType.toString(),
    hba1c: normalized.hba1c.toString(),
    activityLevel: normalized.activityLevel.toString(),
    diabetesStatus: normalized.diabetesStatus.toString(),
    heartDiseaseHistory: normalized.heartDiseaseHistory.toString(),
    
    // Salt and commitment are always required for proof verification
    salt: salt.toString(),
    dataCommitment: dataCommitment.toString(),
    
    // Study criteria (private inputs to circuit)
    enableAge: studyCriteria.enableAge.toString(),
    minAge: studyCriteria.minAge.toString(),
    maxAge: studyCriteria.maxAge.toString(),
    enableCholesterol: studyCriteria.enableCholesterol.toString(),
    minCholesterol: studyCriteria.minCholesterol.toString(),
    maxCholesterol: studyCriteria.maxCholesterol.toString(),
    enableBMI: studyCriteria.enableBMI.toString(),
    minBMI: Math.round(studyCriteria.minBMI * 10).toString(),
    maxBMI: Math.round(studyCriteria.maxBMI * 10).toString(),
    enableBloodType: studyCriteria.enableBloodType.toString(),
    allowedBloodTypes: studyCriteria.allowedBloodTypes.map(v => v.toString()),
    enableGender: studyCriteria.enableGender.toString(),
    allowedGender: studyCriteria.allowedGender.toString(),
    enableLocation: studyCriteria.enableLocation.toString(),
    allowedRegions: studyCriteria.allowedRegions.map(v => v.toString()),
    enableBloodPressure: studyCriteria.enableBloodPressure.toString(),
    minSystolic: studyCriteria.minSystolic.toString(),
    maxSystolic: studyCriteria.maxSystolic.toString(),
    minDiastolic: studyCriteria.minDiastolic.toString(),
    maxDiastolic: studyCriteria.maxDiastolic.toString(),
    enableHbA1c: studyCriteria.enableHbA1c.toString(),
    minHbA1c: Math.round(studyCriteria.minHbA1c * 10).toString(),
    maxHbA1c: Math.round(studyCriteria.maxHbA1c * 10).toString(),
    enableSmoking: studyCriteria.enableSmoking.toString(),
    allowedSmoking: studyCriteria.allowedSmoking.toString(),
    enableActivity: studyCriteria.enableActivity.toString(),
    minActivityLevel: studyCriteria.minActivityLevel.toString(),
    maxActivityLevel: studyCriteria.maxActivityLevel.toString(),
    enableDiabetes: studyCriteria.enableDiabetes.toString(),
    allowedDiabetes: studyCriteria.allowedDiabetes.toString(),
    enableHeartDisease: studyCriteria.enableHeartDisease.toString(),
    allowedHeartDisease: studyCriteria.allowedHeartDisease.toString()
  };
}

/**
 * Check eligibility locally before generating expensive proof
 * This mirrors the circuit's eligibility logic to provide fast client-side validation
 * and prevent wasting resources on proof generation for ineligible patients
 * 
 * @param medicalData - Patient's medical data
 * @param studyCriteria - Study eligibility criteria
 * @returns true if eligible, false otherwise
 */
export function checkEligibility(
  medicalData: ExtractedMedicalData,
  studyCriteria: StudyCriteria
): boolean {
  if (studyCriteria.enableAge) {
    if (medicalData.age === undefined) {
      console.log("❌ Age data missing but required by study");
      return false;
    }
    if (medicalData.age < studyCriteria.minAge || medicalData.age > studyCriteria.maxAge) {
      console.log("❌ Age check failed:", medicalData.age, "not in range", studyCriteria.minAge, "-", studyCriteria.maxAge);
      return false;
    }
  }
  
  // Gender check
  if (studyCriteria.enableGender) {
    if (medicalData.gender === undefined) {
      console.log("❌ Gender data missing but required by study");
      return false;
    }
    if (medicalData.gender !== studyCriteria.allowedGender) {
      console.log("❌ Gender check failed");
      return false;
    }
  }
  
  // Location check
  if (studyCriteria.enableLocation) {
    if (!medicalData.regions || medicalData.regions.length === 0) {
      console.log("❌ Location data missing but required by study");
      return false;
    }
    const hasAllowedRegion = medicalData.regions.some(region => 
      studyCriteria.allowedRegions.includes(region)
    );
    if (!hasAllowedRegion) {
      console.log("❌ Location check failed");
      return false;
    }
  }
  
  // Cholesterol check
  if (studyCriteria.enableCholesterol) {
    if (medicalData.cholesterol === undefined) {
      console.log("❌ Cholesterol data missing but required by study");
      return false;
    }
    if (medicalData.cholesterol < studyCriteria.minCholesterol || 
        medicalData.cholesterol > studyCriteria.maxCholesterol) {
      console.log("❌ Cholesterol check failed");
      return false;
    }
  }
  
  // BMI check
  if (studyCriteria.enableBMI) {
    if (medicalData.bmi === undefined) {
      console.log("❌ BMI data missing but required by study");
      return false;
    }
    if (medicalData.bmi < studyCriteria.minBMI || medicalData.bmi > studyCriteria.maxBMI) {
      console.log("❌ BMI check failed");
      return false;
    }
  }
  
  // Blood pressure check
  if (studyCriteria.enableBloodPressure) {
    if (medicalData.systolicBP === undefined || medicalData.diastolicBP === undefined) {
      console.log("❌ Blood pressure data missing but required by study");
      return false;
    }
    if (medicalData.systolicBP < studyCriteria.minSystolic ||
        medicalData.systolicBP > studyCriteria.maxSystolic ||
        medicalData.diastolicBP < studyCriteria.minDiastolic ||
        medicalData.diastolicBP > studyCriteria.maxDiastolic) {
      console.log("❌ Blood pressure check failed");
      return false;
    }
  }
  
  // Blood type check
  if (studyCriteria.enableBloodType) {
    if (medicalData.bloodType === undefined) {
      console.log("❌ Blood type data missing but required by study");
      return false;
    }
    if (!studyCriteria.allowedBloodTypes.includes(medicalData.bloodType)) {
      console.log("❌ Blood type check failed");
      return false;
    }
  }
  
  // HbA1c check
  if (studyCriteria.enableHbA1c) {
    if (medicalData.hba1c === undefined) {
      console.log("❌ HbA1c data missing but required by study");
      return false;
    }
    if (medicalData.hba1c < studyCriteria.minHbA1c ||
        medicalData.hba1c > studyCriteria.maxHbA1c) {
      console.log("❌ HbA1c check failed");
      return false;
    }
  }
  
  // Smoking status check
  if (studyCriteria.enableSmoking) {
    if (medicalData.smokingStatus === undefined) {
      console.log("❌ Smoking status data missing but required by study");
      return false;
    }
    if (medicalData.smokingStatus !== studyCriteria.allowedSmoking) {
      console.log("❌ Smoking status check failed");
      return false;
    }
  }
  
  // Activity level check
  if (studyCriteria.enableActivity) {
    if (medicalData.activityLevel === undefined) {
      console.log("❌ Activity level data missing but required by study");
      return false;
    }
    if (medicalData.activityLevel < studyCriteria.minActivityLevel ||
        medicalData.activityLevel > studyCriteria.maxActivityLevel) {
      console.log("❌ Activity level check failed");
      return false;
    }
  }
  
  // Diabetes status check
  if (studyCriteria.enableDiabetes) {
    if (medicalData.diabetesStatus === undefined) {
      console.log("❌ Diabetes status data missing but required by study");
      return false;
    }
    if (medicalData.diabetesStatus !== studyCriteria.allowedDiabetes) {
      console.log("❌ Diabetes status check failed");
      return false;
    }
  }
  
  // Heart disease check
  if (studyCriteria.enableHeartDisease) {
    if (medicalData.heartDiseaseStatus === undefined) {
      console.log("❌ Heart disease history data missing but required by study");
      return false;
    }
    if (medicalData.heartDiseaseStatus !== studyCriteria.allowedHeartDisease) {
      console.log("❌ Heart disease history check failed");
      return false;
    }
  }
  
  console.log("✅ All eligibility checks passed!");
  return true;
}

/**
 * Load circuit WASM file from public directory
 * The WASM file contains the compiled circuit logic
 */
async function loadCircuitWasm(): Promise<Uint8Array> {
  console.log("📁 Loading circuit.wasm...");
  
  try {
    const response = await fetch('/circuits/medical_eligibility.wasm');
    console.log("Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to load circuit WASM: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log("✅ Circuit WASM loaded successfully:", (uint8Array.byteLength / 1024).toFixed(2), "KB");
    console.log("✅ Circuit WASM type:", uint8Array.constructor.name, "| Is Uint8Array:", uint8Array instanceof Uint8Array);
    
    return uint8Array;
  } catch (error) {
    console.error("❌ Failed to load circuit WASM:", error);
    throw new Error(
      `Failed to load circuit WASM file. Make sure:\n` +
      `1. The circuit has been compiled: cd packages/smart-contracts/circuits && npm run compile\n` +
      `2. The WASM file has been copied to: apps/web/public/circuits/medical_eligibility.wasm\n` +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Load proving key (zkey) from public directory
 * The proving key is used to generate the ZK proof
 */
async function loadProvingKey(): Promise<Uint8Array> {
  console.log("🔑 Loading proving key...");
  
  try {
    const response = await fetch('/circuits/medical_eligibility_0001.zkey');
    
    if (!response.ok) {
      throw new Error(`Failed to load proving key: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log("✅ Proving key loaded successfully:", (uint8Array.byteLength / 1024 / 1024).toFixed(2), "MB");
    console.log("✅ Proving key type:", uint8Array.constructor.name, "| Is Uint8Array:", uint8Array instanceof Uint8Array);
    
    return uint8Array;
  } catch (error) {
    console.error("❌ Failed to load proving key:", error);
    throw new Error(
      `Failed to load proving key file. Make sure:\n` +
      `1. The trusted setup has been run: cd packages/smart-contracts/circuits && npm run setup-all\n` +
      `2. The zkey file has been copied to: apps/web/public/circuits/medical_eligibility_0001.zkey\n` +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
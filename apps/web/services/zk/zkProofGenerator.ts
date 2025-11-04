/**
 * ZK Proof Generator Service
 * Handles zero-knowledge proof generation for medical data eligibility
 */

import { StudyCriteria } from "@zk-medical/shared";

// Import snarkjs for proof generation
// @ts-ignore - snarkjs doesn't have proper TypeScript definitions
import * as snarkjs from "snarkjs";
import { AggregatedMedicalData } from "../fhir/types/aggregatedMedicalData";
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
  allowedBloodTypes0: string;
  allowedBloodTypes1: string;
  allowedBloodTypes2: string;
  allowedBloodTypes3: string;
  enableGender: string;
  allowedGender: string;
  enableLocation: string;
  allowedRegions0: string;
  allowedRegions1: string;
  allowedRegions2: string;
  allowedRegions3: string;
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
 * @param dataCommitment - Poseidon commitment of the medical data
 * @returns ZK proof and public signals
 */
export const generateZKProof = async (
  medicalData: AggregatedMedicalData,
  studyCriteria: StudyCriteria, 
  dataCommitment: bigint
): Promise<ZKProofResult> => {
  try {
    console.log("🔧 Starting ZK proof generation...");
    console.log("📝 Data commitment:", dataCommitment.toString());
    
    const circuitInput = prepareCircuitInput(medicalData, studyCriteria);
    console.log("📋 Circuit input prepared");
    
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
    
    // Step 3: Load circuit files (these would be fetched from server after commitment)
    console.log("📁 Loading circuit files...");
    const circuitWasm = await loadCircuitWasm();
    const provingKey = await loadProvingKey();
    
    // Step 4: Generate the actual ZK proof using snarkjs
    console.log("⚡ Generating ZK proof (this may take 10-30 seconds)...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      circuitWasm,
      provingKey
    );
    
    // Step 5: Format proof for smart contract
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
 */
function prepareCircuitInput(
  medicalData: AggregatedMedicalData,
  studyCriteria: StudyCriteria
): CircuitInput {
  return {
    // Patient's private medical data
    age: medicalData.age.toString(),
    gender: medicalData.gender.toString(),
    region: (medicalData.regions?.[0] || 0).toString(), // Use first region or default to 0
    cholesterol: (medicalData.cholesterol || 0).toString(),
    bmi: medicalData.bmi.toString(),
    systolicBP: (medicalData.systolicBP || 0).toString(),
    diastolicBP: (medicalData.diastolicBP || 0).toString(),
    bloodType: (medicalData.bloodType || 0).toString(),
    hba1c: (medicalData.hba1c || 0).toString(),
    smokingStatus: medicalData.smokingStatus.toString(),
    activityLevel: (medicalData.activityLevel || 0).toString(),
    diabetesStatus: (medicalData.diabetesStatus || 0).toString(),
    heartDiseaseHistory: medicalData.hasHeartDisease ? "1" : "0", // Convert boolean to string
    salt: "12345", // Generate secure salt - TODO: use actual salt from commitment
    
    // Study criteria (private inputs to circuit)
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
    allowedBloodTypes0: studyCriteria.allowedBloodTypes[0].toString(),
    allowedBloodTypes1: studyCriteria.allowedBloodTypes[1].toString(),
    allowedBloodTypes2: studyCriteria.allowedBloodTypes[2].toString(),
    allowedBloodTypes3: studyCriteria.allowedBloodTypes[3].toString(),
    enableGender: studyCriteria.enableGender.toString(),
    allowedGender: studyCriteria.allowedGender.toString(),
    enableLocation: studyCriteria.enableLocation.toString(),
    allowedRegions0: studyCriteria.allowedRegions[0].toString(),
    allowedRegions1: studyCriteria.allowedRegions[1].toString(),
    allowedRegions2: studyCriteria.allowedRegions[2].toString(),
    allowedRegions3: studyCriteria.allowedRegions[3].toString(),
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
    allowedHeartDisease: studyCriteria.allowedHeartDisease.toString()
  };
}

/**
 * Check eligibility locally before generating expensive proof
 */
function checkEligibility(
  medicalData: AggregatedMedicalData,
  studyCriteria: StudyCriteria
): boolean {
  // Age check
  if (studyCriteria.enableAge && (
    medicalData.age < studyCriteria.minAge || 
    medicalData.age > studyCriteria.maxAge
  )) {
    return false;
  }
  
  // BMI check
  if (studyCriteria.enableBMI && (
    medicalData.bmi < studyCriteria.minBMI || 
    medicalData.bmi > studyCriteria.maxBMI
  )) {
    return false;
  }
  
  // Blood pressure check
  if (studyCriteria.enableBloodPressure && medicalData.systolicBP && medicalData.diastolicBP && (
    medicalData.systolicBP < studyCriteria.minSystolic ||
    medicalData.systolicBP > studyCriteria.maxSystolic ||
    medicalData.diastolicBP < studyCriteria.minDiastolic ||
    medicalData.diastolicBP > studyCriteria.maxDiastolic
  )) {
    return false;
  }
  
  // Add more checks as needed...
  
  return true; // Eligible if all checks pass
}

/**
 * Load circuit WASM file (would be fetched from server after commitment)
 */
async function loadCircuitWasm(): Promise<ArrayBuffer> {
  // In production, this would fetch from your secure server after commitment
  // For now, return a mock that would work with the actual circuit
  console.log("📁 Loading circuit.wasm...");
  
  // TODO: Replace with actual fetch after implementing commitment system
  // const response = await fetch('/api/circuits/medical_eligibility.wasm');
  // return await response.arrayBuffer();
  
  throw new Error("Circuit WASM not available. Need to implement commitment system first.");
}

/**
 * Load proving key (would be fetched from server after commitment)
 */
async function loadProvingKey(): Promise<ArrayBuffer> {
  // In production, this would fetch from your secure server after commitment
  console.log("🔑 Loading proving key...");
  
  // TODO: Replace with actual fetch after implementing commitment system
  // const response = await fetch('/api/circuits/proving_key.zkey');
  // return await response.arrayBuffer();
  
  throw new Error("Proving key not available. Need to implement commitment system first.");
}
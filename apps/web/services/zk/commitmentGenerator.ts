import { poseidon3, poseidon4, poseidon7 } from "poseidon-lite";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

/**
 * Generates a secure data commitment using Poseidon hash
 * This matches the commitment structure expected by the ZK circuit
 *
 * IMPORTANT: Call checkEligibility() BEFORE this function to ensure required fields exist.
 * This function will throw an error if required fields are missing.
 *
 * @param medicalData - Aggregated medical data in ZK-compatible format
 * @param salt - Cryptographically secure random salt (from generateSecureSalt())
 * @param challenge - Optional challenge string (hex) from backend. If provided, uses poseidon4 to match circuit.
 * @returns Poseidon hash commitment as BigInt
 */
export const generateDataCommitment = (medicalData: ExtractedMedicalData, salt: number, challenge?: string): bigint => {
  const normalizedData = normalizeMedicalDataForCircuit(medicalData);

  try {
    const commitment1Inputs = [
      normalizedData.age,
      normalizedData.gender,
      normalizedData.region,
      normalizedData.cholesterol,
      normalizedData.bmi,
      normalizedData.bloodType,
      salt,
    ];

    const commitment2Inputs = [
      normalizedData.systolicBP,
      normalizedData.diastolicBP,
      normalizedData.hba1c,
      normalizedData.smokingStatus,
      normalizedData.activityLevel,
      normalizedData.diabetesStatus,
      normalizedData.heartDiseaseHistory,
    ];

    const commitment1InputsBigInt = commitment1Inputs.map((x) => BigInt(x));
    const commitment2InputsBigInt = commitment2Inputs.map((x) => BigInt(x));

    const commitment1 = poseidon7(commitment1InputsBigInt);
    const commitment2 = poseidon7(commitment2InputsBigInt);
    
    // If challenge is provided, use poseidon4 to match the circuit's finalCommitment structure
    let finalCommitmentHash: bigint;
    if (challenge) {
      const challengeBigInt = BigInt(`0x${challenge}`).toString()
      finalCommitmentHash = poseidon4([commitment1, commitment2, BigInt(salt), challengeBigInt]);
      console.log("Data commitment generated (with challenge):");
      console.log("├─ Commitment 1 inputs:", commitment1Inputs);
      console.log("├─ Commitment 1 hash:", commitment1.toString());
      console.log("├─ Commitment 2 inputs:", commitment2Inputs);
      console.log("├─ Commitment 2 hash:", commitment2.toString());
      console.log("├─ Final inputs:", [commitment1.toString(), commitment2.toString(), salt, challengeBigInt.toString()]);
      console.log("└─ Final commitment:", finalCommitmentHash.toString());
    } else {
      finalCommitmentHash = poseidon3([commitment1, commitment2, BigInt(salt)]);
      console.log("Data commitment generated (without challenge - for initial submission):");
      console.log("├─ Commitment 1 inputs:", commitment1Inputs);
      console.log("├─ Commitment 2 inputs:", commitment2Inputs);
      console.log("├─ Final inputs:", [commitment1, commitment2, salt]);
      console.log("└─ Final commitment:", finalCommitmentHash);
    }

    return finalCommitmentHash;
  } catch (error) {
    console.error("Failed to generate data commitment:", error);
    throw new Error(
      `Data commitment generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const generateSecureSalt = (): number => {
  return crypto.getRandomValues(new Uint32Array(1))[0];
};

/**
 * Normalize medical data into integer, circuit-ready inputs.
 *
 * @param medicalData - ExtractedMedicalData from FHIR extraction
 * @returns Normalized numeric fields ready to be fed into the Poseidon circuit
 * @throws {Error} if required fields are missing
 */
export const normalizeMedicalDataForCircuit = (medicalData: ExtractedMedicalData) => {
  const age = medicalData.age;
  const gender = medicalData.gender;
  let bmi = medicalData.bmi;
  const smokingStatus = medicalData.smokingStatus;

  return {
    age: age ?? -1,
    gender: gender ?? -1,
    bmi: bmi ? Math.round(bmi * 10) : -1,
    smokingStatus: smokingStatus ?? -1,

    region: medicalData.regions?.[0] ?? -1,
    cholesterol: medicalData.cholesterol ?? -1,
    systolicBP: medicalData.systolicBP ?? -1,
    diastolicBP: medicalData.diastolicBP ?? -1,
    hba1c: medicalData.hba1c ? Math.round(medicalData.hba1c * 10) : -1,
    bloodType: medicalData.bloodType ?? -1,
    activityLevel: medicalData.activityLevel ?? -1,
    diabetesStatus: medicalData.diabetesStatus ?? -1,
    heartDiseaseHistory: medicalData.heartDiseaseStatus ?? -1,
  };
};

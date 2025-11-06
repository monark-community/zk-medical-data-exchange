import { poseidon3, poseidon7 } from "poseidon-lite";
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
 * @returns Poseidon hash commitment as BigInt
 */
export const generateDataCommitment = (
  medicalData: ExtractedMedicalData, 
  salt: number
): bigint => {
  const normalizedData = normalizeMedicalDataForCircuit(medicalData);
  
  try {
    const commitment1Inputs = [
      normalizedData.age,
      normalizedData.gender, 
      normalizedData.region,
      normalizedData.cholesterol,
      normalizedData.bmi,
      normalizedData.bloodType,
      salt
    ];
    
    const commitment2Inputs = [
      normalizedData.systolicBP,
      normalizedData.diastolicBP,
      normalizedData.hba1c,
      normalizedData.smokingStatus,
      normalizedData.activityLevel,
      normalizedData.diabetesStatus,
      normalizedData.heartDiseaseHistory
    ];
    
    const commitment1InputsBigInt = commitment1Inputs.map(x => BigInt(x));
    const commitment2InputsBigInt = commitment2Inputs.map(x => BigInt(x));
    
    const commitment1 = poseidon7(commitment1InputsBigInt);
    const commitment2 = poseidon7(commitment2InputsBigInt);
    const finalCommitmentHash = poseidon3([commitment1, commitment2, BigInt(salt)]);

    console.log("Data commitment generated:");
    console.log("├─ Commitment 1 inputs:", commitment1Inputs);
    console.log("├─ Commitment 2 inputs:", commitment2Inputs); 
    console.log("├─ Final inputs:", [commitment1, commitment2, salt]);
    console.log("└─ Final commitment:", finalCommitmentHash);
    
    return finalCommitmentHash;
    
  } catch (error) {
    console.error("Failed to generate data commitment:", error);
    throw new Error(`Data commitment generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates a cryptographically secure salt for commitment
 */
export const generateSecureSalt = (): number => {
  return crypto.getRandomValues(new Uint32Array(1))[0];
};

/**
 * Normalizes medical data to match circuit input requirements
 * Ensures all fields are in the correct format and range expected by ZK circuit
 * 
 * IMPORTANT: This function assumes required fields have been validated by checkEligibility().
 * Optional fields use 0 as sentinel value, but required fields should never be undefined.
 * 
 * EXPORTED for use in zkProofGenerator to ensure consistency between commitment and proof
 */
export const normalizeMedicalDataForCircuit = (medicalData: ExtractedMedicalData) => {
  const age = medicalData.age;
  const gender = medicalData.gender;
  const bmi = medicalData.bmi;
  const smokingStatus = medicalData.smokingStatus;
  
  if (age === undefined || gender === undefined || bmi === undefined || smokingStatus === undefined) {
    throw new Error(
      'Required fields missing'
    );
  }
  
  return {
    age,
    gender,
    bmi: Math.round(bmi * 10),
    smokingStatus,
    
    region: medicalData.regions?.[0] ?? 0,
    cholesterol: medicalData.cholesterol ?? 0,
    systolicBP: medicalData.systolicBP ?? 0,
    diastolicBP: medicalData.diastolicBP ?? 0,
    hba1c: medicalData.hba1c ? Math.round(medicalData.hba1c * 10) : 0,
    bloodType: medicalData.bloodType ?? 0,
    activityLevel: medicalData.activityLevel ?? 0,
    diabetesStatus: medicalData.diabetesStatus ?? 0,
    heartDiseaseHistory: medicalData.heartDiseaseStatus ?? 0,
  };
};


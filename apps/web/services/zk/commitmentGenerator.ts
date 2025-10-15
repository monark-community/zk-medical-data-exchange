import { AggregatedMedicalData } from "@/services/core/medicalDataAggregator";
import { poseidon3, poseidon7 } from "poseidon-lite";

/**
 * Generates a secure data commitment using Poseidon hash
 * This matches the commitment structure expected by the ZK circuit
 * 
 * @param medicalData - Aggregated medical data in ZK-compatible format
 * @param salt - Cryptographically secure random salt
 * @returns Poseidon hash commitment as hex string
 */
export const generateDataCommitment = (
  medicalData: AggregatedMedicalData, 
  salt: number
): BigInt => {
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
 * Validates that medical data is complete for commitment generation
 */
export const validateMedicalDataForCommitment = (
  medicalData: AggregatedMedicalData
): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['age', 'gender', 'bmi', 'smokingStatus', 'hasHeartDisease'];
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (medicalData[field as keyof AggregatedMedicalData] === undefined) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
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
 */
const normalizeMedicalDataForCircuit = (medicalData: AggregatedMedicalData) => {
  return {
    age: medicalData.age || 0,
    gender: medicalData.gender || 1, // Default to female
    region: medicalData.regions?.[0] || 1, // Use first region or default to North America
    cholesterol: medicalData.cholesterol || 0,
    bmi: Math.round((medicalData.bmi || 0) * 10), // Circuit expects BMI * 10 as integer
    bloodType: medicalData.bloodType || 1, // Default blood type
    systolicBP: medicalData.systolicBP || 0,
    diastolicBP: medicalData.diastolicBP || 0,
    hba1c: Math.round((medicalData.hba1c || 0) * 10), // Circuit expects HbA1c * 10 as integer
    smokingStatus: medicalData.smokingStatus || 0, // 0 = never smoked
    activityLevel: medicalData.activityLevel || 1, // Default activity level
    diabetesStatus: medicalData.diabetesStatus || 0, // 0 = no diabetes
    heartDiseaseHistory: medicalData.hasHeartDisease ? 1 : 0, // Convert boolean to number
  };
};


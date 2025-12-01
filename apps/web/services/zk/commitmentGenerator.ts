import { poseidon4, poseidon7 } from "poseidon-lite";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

/**
 * Safely convert a number to BigInt, ensuring it's an integer
 */
const safeBigInt = (value: number): bigint => {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error("Invalid medical data format. Please ensure all values are properly formatted.");
  }
  return BigInt(value);
};

export const generateDataCommitment = (medicalData: ExtractedMedicalData, salt: number, challenge: string): bigint => {
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

    const commitment1InputsBigInt = commitment1Inputs.map((x) => safeBigInt(x));
    const commitment2InputsBigInt = commitment2Inputs.map((x) => safeBigInt(x));

    const commitment1 = poseidon7(commitment1InputsBigInt);
    const commitment2 = poseidon7(commitment2InputsBigInt);

    let finalCommitmentHash: bigint;

    const challengeHex = challenge.startsWith('0x') ? challenge.slice(2) : challenge;
    const challengeBigInt = BigInt(`0x${challengeHex}`);

    finalCommitmentHash = poseidon4([commitment1, commitment2, BigInt(salt), challengeBigInt]);
    console.log("Data commitment generated (with challenge):");
    console.log("├─ Commitment 1 inputs:", commitment1Inputs);
    console.log("├─ Commitment 1 hash:", commitment1.toString());
    console.log("├─ Commitment 2 inputs:", commitment2Inputs);
    console.log("├─ Commitment 2 hash:", commitment2.toString());
    console.log("├─ Challenge (hex):", challenge);
    console.log("├─ Challenge (bigint):", challengeBigInt.toString());
    console.log("├─ Final inputs:", [commitment1.toString(), commitment2.toString(), salt.toString(), challengeBigInt.toString()]);
    console.log("└─ Final commitment:", finalCommitmentHash.toString());

    return finalCommitmentHash;
  } catch (error) {
    console.error("Failed to generate data commitment:", error);
    throw new Error("Unable to process medical data securely. Please verify your information.");
  }
};

export const generateSecureSalt = (): number => {
  return crypto.getRandomValues(new Uint32Array(1))[0];
};

export const normalizeMedicalDataForCircuit = (medicalData: ExtractedMedicalData) => {
  const age = medicalData.age;
  const gender = medicalData.gender;
  let bmi = medicalData.bmi;
  const smokingStatus = medicalData.smokingStatus;

  return {
    age: age ?? -1,
    gender: gender ?? -1,
    bmi: bmi !== undefined ? Math.round(bmi * 10) : -1,
    smokingStatus: smokingStatus ?? -1,

    region: medicalData.regions?.[0] ?? -1,
    cholesterol: medicalData.cholesterol ?? -1,
    systolicBP: medicalData.systolicBP ?? -1,
    diastolicBP: medicalData.diastolicBP ?? -1,
    hba1c: medicalData.hba1c !== undefined ? Math.round(medicalData.hba1c * 10) : -1,
    bloodType: medicalData.bloodType ?? -1,
    activityLevel: medicalData.activityLevel ?? -1,
    diabetesStatus: medicalData.diabetesStatus ?? -1,
    heartDiseaseHistory: medicalData.heartDiseaseStatus ?? -1,
  };
};
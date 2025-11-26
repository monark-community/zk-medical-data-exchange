import { poseidon4, poseidon7 } from "poseidon-lite";
import { ExtractedMedicalData } from "@zk-medical/shared";

export const generateDataCommitment = (medicalData: ExtractedMedicalData, salt: number, challenge: string): bigint => {

  try {
    const commitment1Inputs = [
      medicalData.age,
      medicalData.gender,
      medicalData.regions ? medicalData.regions[0] : -1,
      medicalData.cholesterol,
      medicalData.bmi,
      medicalData.bloodType,
      salt,
    ];

    const commitment2Inputs = [
      medicalData.systolicBP,
      medicalData.diastolicBP,
      medicalData.hba1c,
      medicalData.smokingStatus,
      medicalData.activityLevel,
      medicalData.diabetesStatus,
      medicalData.heartDiseaseStatus,
    ];

    const commitment1InputsBigInt = commitment1Inputs.map((x) => BigInt(x));
    const commitment2InputsBigInt = commitment2Inputs.map((x) => BigInt(x));

    const commitment1 = poseidon7(commitment1InputsBigInt);
    const commitment2 = poseidon7(commitment2InputsBigInt);

    const challengeHex = challenge.startsWith('0x') ? challenge.slice(2) : challenge;
    const challengeBigInt = BigInt(`0x${challengeHex}`);

    let finalCommitmentHash = poseidon4([commitment1, commitment2, BigInt(salt), challengeBigInt]);
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
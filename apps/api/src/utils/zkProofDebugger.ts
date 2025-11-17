import logger from "@/utils/logger";

/**
 * Debug utility for ZK proof verification failures
 * This helps identify mismatches between client-side proof generation and on-chain verification
 */

export interface ProofDebugInfo {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
  studyAddress: string;
  participantWallet: string;
  dataCommitment: string;
  challenge: string;
}

export interface ExpectedPublicSignals {
  enableAge: bigint;
  minAge: bigint;
  maxAge: bigint;
  enableCholesterol: bigint;
  minCholesterol: bigint;
  maxCholesterol: bigint;
  enableBMI: bigint;
  minBMI: bigint;
  maxBMI: bigint;
  enableBloodType: bigint;
  allowedBloodTypes: [bigint, bigint, bigint, bigint];
  enableGender: bigint;
  allowedGender: bigint;
  enableLocation: bigint;
  allowedRegions: [bigint, bigint, bigint, bigint];
  enableBloodPressure: bigint;
  minSystolic: bigint;
  maxSystolic: bigint;
  minDiastolic: bigint;
  maxDiastolic: bigint;
  enableHbA1c: bigint;
  minHbA1c: bigint;
  maxHbA1c: bigint;
  enableSmoking: bigint;
  allowedSmoking: bigint;
  enableActivity: bigint;
  minActivityLevel: bigint;
  maxActivityLevel: bigint;
  enableDiabetes: bigint;
  allowedDiabetes: bigint;
  enableHeartDisease: bigint;
  allowedHeartDisease: bigint;
  dataCommitment: bigint;
  studyId: bigint;
  walletAddress: bigint;
  challenge: bigint;
}

/**
 * Reconstructs the expected public signals array that the smart contract will build
 * This matches the _buildPublicSignals function in Study.sol
 */
export function buildExpectedPublicSignals(
  criteria: any,
  dataCommitment: string,
  studyId: number,
  participantWallet: string,
  challenge: string
): string[] {
  const pubSignals: string[] = [];
  
  // Convert wallet address to uint160
  const walletBigInt = BigInt(participantWallet);
  
  // Convert challenge hex string to BigInt
  const challengeBytes32 = challenge.startsWith('0x') ? challenge : `0x${challenge}`;
  const challengeBigInt = BigInt(challengeBytes32);

  // Order must match Study.sol _buildPublicSignals exactly
  pubSignals.push(criteria.enableAge.toString());
  pubSignals.push(criteria.minAge.toString());
  pubSignals.push(criteria.maxAge.toString());
  pubSignals.push(criteria.enableCholesterol.toString());
  pubSignals.push(criteria.minCholesterol.toString());
  pubSignals.push(criteria.maxCholesterol.toString());
  pubSignals.push(criteria.enableBMI.toString());
  pubSignals.push(criteria.minBMI.toString());
  pubSignals.push(criteria.maxBMI.toString());
  pubSignals.push(criteria.enableBloodType.toString());
  pubSignals.push(criteria.allowedBloodTypes[0].toString());
  pubSignals.push(criteria.allowedBloodTypes[1].toString());
  pubSignals.push(criteria.allowedBloodTypes[2].toString());
  pubSignals.push(criteria.allowedBloodTypes[3].toString());
  pubSignals.push(criteria.enableGender.toString());
  pubSignals.push(criteria.allowedGender.toString());
  pubSignals.push(criteria.enableLocation.toString());
  pubSignals.push(criteria.allowedRegions[0].toString());
  pubSignals.push(criteria.allowedRegions[1].toString());
  pubSignals.push(criteria.allowedRegions[2].toString());
  pubSignals.push(criteria.allowedRegions[3].toString());
  pubSignals.push(criteria.enableBloodPressure.toString());
  pubSignals.push(criteria.minSystolic.toString());
  pubSignals.push(criteria.maxSystolic.toString());
  pubSignals.push(criteria.minDiastolic.toString());
  pubSignals.push(criteria.maxDiastolic.toString());
  pubSignals.push(criteria.enableHbA1c.toString());
  pubSignals.push(criteria.minHbA1c.toString());
  pubSignals.push(criteria.maxHbA1c.toString());
  pubSignals.push(criteria.enableSmoking.toString());
  pubSignals.push(criteria.allowedSmoking.toString());
  pubSignals.push(criteria.enableActivity.toString());
  pubSignals.push(criteria.minActivityLevel.toString());
  pubSignals.push(criteria.maxActivityLevel.toString());
  pubSignals.push(criteria.enableDiabetes.toString());
  pubSignals.push(criteria.allowedDiabetes.toString());
  pubSignals.push(criteria.enableHeartDisease.toString());
  pubSignals.push(criteria.allowedHeartDisease.toString());
  pubSignals.push(BigInt(dataCommitment).toString());
  pubSignals.push(BigInt(studyId).toString());
  pubSignals.push(walletBigInt.toString());
  pubSignals.push(challengeBigInt.toString());

  return pubSignals;
}

/**
 * Compares actual proof public signals with expected signals from contract
 * Returns detailed mismatch information for debugging
 */
export function comparePublicSignals(
  actualSignals: string[],
  expectedSignals: string[]
): {
  matches: boolean;
  mismatches: Array<{
    index: number;
    fieldName: string;
    actual: string;
    expected: string;
  }>;
} {
  const fieldNames = [
    "enableAge", "minAge", "maxAge",
    "enableCholesterol", "minCholesterol", "maxCholesterol",
    "enableBMI", "minBMI", "maxBMI",
    "enableBloodType", 
    "allowedBloodTypes[0]", "allowedBloodTypes[1]", "allowedBloodTypes[2]", "allowedBloodTypes[3]",
    "enableGender", "allowedGender",
    "enableLocation", 
    "allowedRegions[0]", "allowedRegions[1]", "allowedRegions[2]", "allowedRegions[3]",
    "enableBloodPressure", "minSystolic", "maxSystolic", "minDiastolic", "maxDiastolic",
    "enableHbA1c", "minHbA1c", "maxHbA1c",
    "enableSmoking", "allowedSmoking",
    "enableActivity", "minActivityLevel", "maxActivityLevel",
    "enableDiabetes", "allowedDiabetes",
    "enableHeartDisease", "allowedHeartDisease",
    "dataCommitment", "studyId", "walletAddress", "eligibilityExpected", "challenge"
  ];

  const mismatches: Array<{
    index: number;
    fieldName: string;
    actual: string;
    expected: string;
  }> = [];

  const minLength = Math.min(actualSignals.length, expectedSignals.length);
  
  for (let i = 0; i < minLength; i++) {
    if (actualSignals[i] !== expectedSignals[i]) {
      mismatches.push({
        index: i,
        fieldName: fieldNames[i] || `unknown[${i}]`,
        actual: actualSignals[i],
        expected: expectedSignals[i]
      });
    }
  }

  // Check for length mismatch
  if (actualSignals.length !== expectedSignals.length) {
    logger.error({
      actualLength: actualSignals.length,
      expectedLength: expectedSignals.length
    }, "Public signals length mismatch");
  }

  return {
    matches: mismatches.length === 0 && actualSignals.length === expectedSignals.length,
    mismatches
  };
}

/**
 * Logs detailed debugging information for a failed proof verification
 */
export function logProofDebugInfo(
  proofInfo: ProofDebugInfo,
  onChainCriteria: any,
  studyId: number
): void {
  logger.info("=== ZK PROOF VERIFICATION DEBUG ===");
  
  // Build what the contract expects
  const expectedSignals = buildExpectedPublicSignals(
    onChainCriteria,
    proofInfo.dataCommitment,
    studyId,
    proofInfo.participantWallet,
    proofInfo.challenge
  );

  // Compare
  const comparison = comparePublicSignals(proofInfo.publicSignals, expectedSignals);

  if (!comparison.matches) {
    logger.error({
      totalMismatches: comparison.mismatches.length,
      mismatches: comparison.mismatches
    }, "Public signals mismatch detected!");

    // Log first few mismatches in detail
    comparison.mismatches.slice(0, 5).forEach((mismatch) => {
      logger.error({
        field: mismatch.fieldName,
        index: mismatch.index,
        clientValue: mismatch.actual,
        contractValue: mismatch.expected,
        match: mismatch.actual === mismatch.expected
      }, `Mismatch in ${mismatch.fieldName}`);
    });

    if (comparison.mismatches.length > 5) {
      logger.error(`... and ${comparison.mismatches.length - 5} more mismatches`);
    }
  } else {
    logger.info("Public signals match perfectly - issue may be in proof itself");
  }

  // Log proof details
  logger.info({
    proofA: proofInfo.proof.a,
    proofB: proofInfo.proof.b,
    proofC: proofInfo.proof.c,
  }, "Proof components");

  logger.info({
    dataCommitment: proofInfo.dataCommitment,
    challenge: proofInfo.challenge,
    participantWallet: proofInfo.participantWallet,
    studyAddress: proofInfo.studyAddress
  }, "Verification context");

  logger.info("=== END DEBUG ===");
}

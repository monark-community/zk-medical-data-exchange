/**
 * Validation utility for ZK proof public signals
 * Helps identify overflow issues and invalid signal values
 */

import logger from "@/utils/logger";

interface SignalValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that public signals are within acceptable ranges
 * This catches common issues like BigInt overflow or incorrect conversions
 */
export function validatePublicSignals(signals: string[]): SignalValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Expected length is 42 signals (criteria + metadata: dataCommitment, studyId, wallet, challenge)
  if (signals.length !== 42) {
    errors.push(`Expected 42 public signals, got ${signals.length}`);
  }

  // Helper to check if a value is a valid field element (< 2^254)
  const FIELD_PRIME = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  
  const isValidFieldElement = (value: string, index: number, name: string): boolean => {
    try {
      const bigIntValue = BigInt(value);
      
      // Check if negative (shouldn't happen)
      if (bigIntValue < 0n) {
        errors.push(`Signal ${index} (${name}): Negative value ${value}`);
        return false;
      }
      
      // Check if exceeds field prime (circuit will fail)
      if (bigIntValue >= FIELD_PRIME) {
        errors.push(`Signal ${index} (${name}): Value ${value} exceeds field prime`);
        return false;
      }
      
      // Warn if suspiciously large (might be overflow)
      if (bigIntValue > BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")) {
        warnings.push(`Signal ${index} (${name}): Unusually large value ${value}`);
      }
      
      return true;
    } catch (e) {
      errors.push(`Signal ${index} (${name}): Invalid BigInt format "${value}"`);
      return false;
    }
  };

  // Validate each signal with semantic meaning
  const signalDefs = [
    { name: "enableAge", range: [0, 1] },
    { name: "minAge", range: [0, 150] },
    { name: "maxAge", range: [0, 150] },
    { name: "enableCholesterol", range: [0, 1] },
    { name: "minCholesterol", range: [0, 1000] },
    { name: "maxCholesterol", range: [0, 1000] },
    { name: "enableBMI", range: [0, 1] },
    { name: "minBMI", range: [100, 800] }, // scaled by 10
    { name: "maxBMI", range: [100, 800] },
    { name: "enableBloodType", range: [0, 1] },
    { name: "allowedBloodTypes[0]", range: [0, 8] },
    { name: "allowedBloodTypes[1]", range: [0, 8] },
    { name: "allowedBloodTypes[2]", range: [0, 8] },
    { name: "allowedBloodTypes[3]", range: [0, 8] },
    { name: "enableGender", range: [0, 1] },
    { name: "allowedGender", range: [0, 3] },
    { name: "enableLocation", range: [0, 1] },
    { name: "allowedRegions[0]", range: [0, 100] },
    { name: "allowedRegions[1]", range: [0, 100] },
    { name: "allowedRegions[2]", range: [0, 100] },
    { name: "allowedRegions[3]", range: [0, 100] },
    { name: "enableBloodPressure", range: [0, 1] },
    { name: "minSystolic", range: [70, 250] },
    { name: "maxSystolic", range: [70, 250] },
    { name: "minDiastolic", range: [40, 150] },
    { name: "maxDiastolic", range: [40, 150] },
    { name: "enableHbA1c", range: [0, 1] },
    { name: "minHbA1c", range: [40, 200] }, // scaled by 10
    { name: "maxHbA1c", range: [40, 200] },
    { name: "enableSmoking", range: [0, 1] },
    { name: "allowedSmoking", range: [0, 3] },
    { name: "enableActivity", range: [0, 1] },
    { name: "minActivityLevel", range: [0, 500] },
    { name: "maxActivityLevel", range: [0, 500] },
    { name: "enableDiabetes", range: [0, 1] },
    { name: "allowedDiabetes", range: [0, 3] },
    { name: "enableHeartDisease", range: [0, 1] },
    { name: "allowedHeartDisease", range: [0, 2] },
    { name: "dataCommitment", range: null }, // Any value OK for commitment
    { name: "studyId", range: [0, Number.MAX_SAFE_INTEGER] },
    { name: "walletAddress", range: null }, // uint160
    { name: "challenge", range: null }, // bytes32
  ];

  signals.forEach((signal, index) => {
    const def = signalDefs[index];
    if (!def) return;

    // Check if it's a valid field element
    if (!isValidFieldElement(signal, index, def.name)) {
      return; // Error already logged
    }

    // Check semantic range if defined
    if (def.range) {
      try {
        const value = Number(BigInt(signal));
        const [min, max] = def.range;
        
        if (value < min || value > max) {
          warnings.push(
            `Signal ${index} (${def.name}): Value ${value} outside expected range [${min}, ${max}]`
          );
        }
      } catch (e) {
        // Already caught by isValidFieldElement
      }
    }
  });

  // Validate wallet address is uint160 (index 40)
  if (signals[40]) {
    try {
      const wallet = BigInt(signals[40]);
      const maxUint160 = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
      if (wallet > maxUint160) {
        errors.push(`WalletAddress exceeds uint160 maximum: ${signals[41]}`);
      }
    } catch (e) {
      // Already caught above
    }
  }

  // Challenge at index 41 - no specific validation needed (bytes32)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results with proper formatting
 */
export function logValidationResults(validation: SignalValidation): void {
  if (validation.isValid) {
    logger.info("✓ Public signals validation passed");
    if (validation.warnings.length > 0) {
      logger.warn({ warnings: validation.warnings }, "Public signals validation warnings");
    }
  } else {
    logger.error(
      {
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      "✗ Public signals validation FAILED"
    );
  }
}

/**
 * Detect potential overflow issues in proof generation
 */
export function detectOverflow(
  medicalData: any,
  studyCriteria: any
): { hasOverflow: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for values that might cause overflow
  const checkValue = (value: any, name: string, max: number) => {
    if (typeof value === 'number' && value > max) {
      issues.push(`${name} value ${value} exceeds safe maximum ${max}`);
    }
  };

  // Check medical data
  if (medicalData) {
    checkValue(medicalData.age, "Age", 150);
    checkValue(medicalData.cholesterol, "Cholesterol", 1000);
    checkValue(medicalData.bmi, "BMI (unscaled)", 80);
    checkValue(medicalData.systolicBP, "Systolic BP", 250);
    checkValue(medicalData.diastolicBP, "Diastolic BP", 150);
    checkValue(medicalData.hba1c, "HbA1c (unscaled)", 20);
    checkValue(medicalData.activityLevel, "Activity Level", 500);
  }

  // Check study criteria for array sizes
  if (studyCriteria) {
    if (studyCriteria.allowedBloodTypes && studyCriteria.allowedBloodTypes.length !== 4) {
      issues.push(`allowedBloodTypes must have exactly 4 elements, has ${studyCriteria.allowedBloodTypes.length}`);
    }
    if (studyCriteria.allowedRegions && studyCriteria.allowedRegions.length !== 4) {
      issues.push(`allowedRegions must have exactly 4 elements, has ${studyCriteria.allowedRegions.length}`);
    }
  }

  return {
    hasOverflow: issues.length > 0,
    issues,
  };
}

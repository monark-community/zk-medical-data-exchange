# ZK Proof Verification Failure - Diagnostic Guide

## Problem
The error "ZK proof verification failed - not eligible" indicates that the zero-knowledge proof generated on the client side is not passing verification in the smart contract.

## Root Causes

### 1. **Public Signals Mismatch** (Most Common)
The proof is generated with certain public signals (study criteria), but the smart contract reconstructs them differently.

**To diagnose:**
```typescript
// Check the logs after enabling the debugger
// Look for "Public signals being sent with proof"
// Compare with on-chain criteria
```

### 2. **Study Criteria Mismatch**
The criteria used to generate the proof don't match what's stored on-chain.

**Common issues:**
- Criteria were updated after deployment
- BigInt conversion issues (arrays must be exactly 4 elements)
- Default values differ between client and contract

### 3. **Challenge or Commitment Issues**
- Challenge wasn't registered properly
- DataCommitment calculation differs between client/server
- Commitment tampering detected

### 4. **Medical Data Doesn't Meet Criteria**
Despite client-side checks passing, the actual data doesn't satisfy the study requirements.

## Debugging Steps

### Step 1: Enable Enhanced Logging
The code now includes enhanced debugging. When proof verification fails, check logs for:

```
[ERROR] Failed to record participation on blockchain
  studyAddress: "0x..."
  publicSignalsLength: 44
  expectedLength: 44
```

### Step 2: Compare Public Signals
Check that all 44 public signals match this order:

```
[0-2]   enableAge, minAge, maxAge
[3-5]   enableCholesterol, minCholesterol, maxCholesterol  
[6-8]   enableBMI, minBMI, maxBMI
[9-13]  enableBloodType, allowedBloodTypes[0-3]
[14-15] enableGender, allowedGender
[16-20] enableLocation, allowedRegions[0-3]
[21-25] enableBloodPressure, minSystolic, maxSystolic, minDiastolic, maxDiastolic
[26-28] enableHbA1c, minHbA1c, maxHbA1c
[29-30] enableSmoking, allowedSmoking
[31-33] enableActivity, minActivityLevel, maxActivityLevel
[34-35] enableDiabetes, allowedDiabetes
[36-37] enableHeartDisease, allowedHeartDisease
[38]    dataCommitment
[39]    studyId
[40]    walletAddress (as uint160)
[41]    eligibilityExpected (always 1)
[42]    challenge
```

### Step 3: Verify Eligibility Locally
Before generating the proof, the client checks eligibility with `checkEligibility()`. If this passes but on-chain verification fails, there's a data transformation issue.

**Check for:**
- BMI scaling (must be multiplied by 10)
- HbA1c scaling (must be multiplied by 10)
- Blood type encoding (1-8 for A+, A-, B+, B-, AB+, AB-, O+, O-)
- Gender encoding (1=male, 2=female, 3=other)
- Region encoding

### Step 4: Validate On-Chain Criteria
Query the smart contract directly to see what criteria it has:

```typescript
// Using viem
const criteria = await publicClient.readContract({
  address: studyAddress,
  abi: STUDY_ABI,
  functionName: 'criteria'
});

console.log('On-chain criteria:', criteria);
```

### Step 5: Check Circuit Compilation
Ensure the circuit files match:
- `medical_eligibility.circom` - the circuit definition
- `medical_eligibility.wasm` - compiled circuit
- `medical_eligibility_final.zkey` - proving key
- `MedicalEligibilityVerifier.sol` - the on-chain verifier

If any of these were regenerated, **all must be regenerated together**.

## Common Fixes

### Fix 1: Criteria Arrays Must Have Exactly 4 Elements
```typescript
// WRONG - will cause verification failure
allowedBloodTypes: [1, 2]

// RIGHT - always pad to 4 elements
allowedBloodTypes: [1, 2, 0, 0]
```

### Fix 2: Wallet Address Must Be uint160
```typescript
// In the circuit input
walletAddress: BigInt(walletAddress).toString()

// This converts "0x1234..." to a number
```

### Fix 3: Challenge Must Be bytes32
```typescript
// Ensure challenge is properly formatted
const challengeBytes32 = challenge.startsWith('0x') ? challenge : `0x${challenge}`;
```

### Fix 4: DataCommitment Must Match Exactly
```typescript
// Client and server must use identical normalization
const normalized = normalizeMedicalDataForCircuit(medicalData);
const commitment = generateDataCommitment(normalized, salt);
```

## Testing Recommendations

### 1. Test With Simple Criteria
Start with a study that has only ONE criterion enabled (e.g., just age):
```typescript
{
  enableAge: 1,
  minAge: 18,
  maxAge: 99,
  // All other fields: 0 or default
}
```

### 2. Test Proof Generation Locally
Use the test files in `packages/smart-contracts/test/` to verify proof generation works:
```bash
cd packages/smart-contracts
npx hardhat test test/zkProofIntegration.test.cjs
```

### 3. Compare Input Hashes
Log the hash of all inputs on both client and contract side to identify where they diverge.

## Next Steps

1. Check the server logs after the latest code changes - they now include public signals details
2. Compare the logged public signals with what the contract expects
3. If criteria mismatch is found, either:
   - Re-deploy the study with correct criteria, OR
   - Fix the client-side criteria fetching
4. If data doesn't meet criteria, verify the data normalization matches the circuit's expectations

## Additional Resources

- Circuit code: `packages/smart-contracts/circuits/medical_eligibility.circom`
- Contract code: `packages/smart-contracts/contracts/studies/Study.sol` (see `_buildPublicSignals`)
- Proof generator: `apps/web/services/zk/zkProofGenerator.ts`
- Debug utility: `apps/api/src/utils/zkProofDebugger.ts`

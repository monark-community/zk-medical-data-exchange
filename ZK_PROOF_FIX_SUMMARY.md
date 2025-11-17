# ZK Proof Verification Failure - Analysis & Fixes

## Issue Summary
You're experiencing a "ZK proof verification failed - not eligible" error when trying to join a study. The proof is being generated successfully on the client side, but failing verification in the smart contract.

## Changes Made

### 1. Enhanced Debugging Infrastructure

#### a) Signal Validator (`apps/api/src/utils/signalValidator.ts`)
- Validates all 44 public signals are within acceptable ranges
- Detects BigInt overflow issues
- Checks for semantic correctness (e.g., age < 150, gender in [0-3])
- Warns about suspicious values

#### b) Proof Debugger (`apps/api/src/utils/zkProofDebugger.ts`)
- Reconstructs expected public signals matching contract logic
- Compares client signals with contract signals
- Identifies specific field mismatches
- Provides detailed mismatch reports

#### c) Enhanced Logging in `studyService.ts`
- Now validates public signals before submission
- Logs key signal values (dataCommitment, studyId, wallet, challenge)
- Provides clear error messages with indices for mismatches

### 2. Function Signature Updates

Updated `sendParticipationToBlockchain` and `joinBlockchainStudy` to accept:
- `publicSignals: string[]` - The proof's public outputs
- `studyId?: number` - For better logging context

## Root Cause Analysis

Looking at your error log, I noticed some extremely large numbers in the proof:
```
2.0589828671840418e+75  // This is way too large!
```

This suggests one of these issues:

### Issue 1: BigInt Overflow (MOST LIKELY)
JavaScript numbers are being converted incorrectly to BigInt for the circuit.

**Fix:** Ensure all conversions use proper BigInt handling:
```typescript
// WRONG
const value = Number(bigIntValue); // Loses precision!

// RIGHT
const value = BigInt(numericValue).toString();
```

### Issue 2: Array Padding
Study criteria arrays must have exactly 4 elements:
```typescript
// WRONG
allowedBloodTypes: [1, 2]  // Only 2 elements

// RIGHT
allowedBloodTypes: [1, 2, 0, 0]  // Must be 4 elements
```

### Issue 3: Wallet Address Conversion
The wallet address must be converted to uint160:
```typescript
// Correct conversion
const walletBigInt = BigInt(walletAddress); // "0x..." to number
```

### Issue 4: Criteria Mismatch
The criteria stored on-chain may differ from what's being used client-side.

## How to Diagnose Your Issue

### Step 1: Check Latest Logs
With the new code, when proof verification fails, check logs for:
```
✗ Public signals validation FAILED
  errorCount: X
  errors: [...]
```

This will tell you exactly which signals are problematic.

### Step 2: Check Signal Values
Look for the log entry:
```
Public signals being sent with proof
  dataCommitment: "..."
  studyIdFromSignals: "..."
  walletFromSignals: "..."
  eligibilityExpected: "..."
  challengeFromSignals: "..."
```

Compare these with what you expect.

### Step 3: Verify Criteria
Fetch the on-chain criteria:
```bash
# Using cast (Foundry)
cast call <STUDY_ADDRESS> "criteria()" --rpc-url <RPC_URL>
```

Compare with database criteria:
```sql
SELECT criteria_json FROM studies WHERE id = <STUDY_ID>;
```

## Quick Fixes to Try

### Fix 1: Regenerate Circuit Files
If circuit/verifier mismatch:
```bash
cd packages/smart-contracts
bun run circuits:build
bun run circuits:compile
```

### Fix 2: Validate Criteria Consistency
Ensure `formatCriteriaForContract` in `studyService.ts` matches the client-side criteria preparation in `zkProofGenerator.ts`.

### Fix 3: Test with Minimal Criteria
Create a test study with only ONE criterion:
```typescript
{
  enableAge: 1,
  minAge: 18,
  maxAge: 99,
  // All others: 0 or defaults
}
```

If this works, gradually add criteria to find the problematic one.

### Fix 4: Check Challenge Format
Ensure challenge is properly formatted as bytes32:
```typescript
const challengeBytes32 = challenge.startsWith('0x') 
  ? challenge 
  : `0x${challenge}`;
```

## Testing After Fixes

### 1. Run Unit Tests
```bash
cd packages/smart-contracts
npx hardhat test test/zkProofIntegration.test.cjs
```

### 2. Test Locally
```bash
cd apps/api
bun run dev
```

Watch the logs when attempting to join a study. The new validation will show exactly what's wrong.

### 3. Verify Proof Locally
Before submitting to blockchain:
```typescript
import { groth16 } from 'snarkjs';

const vKey = await fetch('/verification_key.json').then(r => r.json());
const isValid = await groth16.verify(vKey, publicSignals, proof);
console.log('Local verification:', isValid);
```

## Next Actions

1. **Restart your API server** to pick up the new debugging code
2. **Attempt to join the study again**
3. **Check the server logs** for the new validation messages
4. **Report the specific errors** shown in the validation output

The new logging will pinpoint exactly which public signal is causing the issue, making it much easier to fix.

## Common Error Patterns

### Pattern 1: All Signals Too Large
**Symptom:** Every signal is > 10^70
**Cause:** Incorrect BigInt conversion in circuit input preparation
**Fix:** Check `prepareCircuitInput` in `zkProofGenerator.ts`

### Pattern 2: Signal 40 (Wallet) Invalid
**Symptom:** Wallet signal exceeds uint160 max
**Cause:** Wallet not converted from hex string to number
**Fix:** Ensure `BigInt(walletAddress)` conversion

### Pattern 3: Signals 38-42 Mismatch
**Symptom:** Last 5 signals don't match expected values
**Cause:** Challenge, commitment, or studyId incorrect
**Fix:** Verify these values match between client/server

### Pattern 4: Signals 0-37 Off-by-One
**Symptom:** Criteria values shifted by one position
**Cause:** Array padding issue
**Fix:** Ensure all arrays have exactly 4 elements

## Support Files

- **Debug Guide:** `ZK_PROOF_DEBUG_GUIDE.md` - Comprehensive debugging steps
- **Validator:** `apps/api/src/utils/signalValidator.ts` - Signal validation logic
- **Debugger:** `apps/api/src/utils/zkProofDebugger.ts` - Proof comparison tools

## Contact Points

If you're still stuck after following these steps, provide:
1. The complete validation error from logs
2. The study ID and contract address
3. The public signals array (first 10 elements)
4. The study criteria used for proof generation

This will help identify the exact mismatch.

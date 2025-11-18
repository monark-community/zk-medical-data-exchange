# Phase 3: Single Circuit Approach - Summary

## 🎯 Key Design Decision

**You're absolutely right!** All studies will eventually have bins, so we've consolidated everything into **one circuit** that handles both cases:

- **Studies WITH bins:** Pass `numBins > 0`, bin membership outputs are populated
- **Studies WITHOUT bins:** Pass `numBins = 0`, bin membership outputs are all zeros

This eliminates the need for:
- ❌ Two separate circuits
- ❌ Two sets of circuit files (.wasm and .zkey)
- ❌ Conditional logic to choose which circuit to use
- ❌ Separate verifier contracts

---

## ✅ What Changed

### Circuit (`medical_eligibility.circom`)
- **Extended** the existing circuit (not a new file)
- Added bin-related inputs and outputs
- Bin computation only activates when `numBins > 0`
- **Fully backward compatible** with existing studies

### Proof Generator (`zkProofGenerator.ts`)
- **Single function:** `generateZKProof()` accepts optional `binConfiguration` parameter
- Same circuit files for all studies
- Automatically handles bins if configuration provided
- Returns `binMembership` in result only if bins are configured

### Deployment Process
- **One circuit to compile**
- **One trusted setup ceremony**
- **One verifier contract**
- **One set of circuit files** in frontend

---

## 🚀 Deployment Steps (Simplified)

```bash
# 1. Compile the updated circuit
cd packages/smart-contracts/circuits
circom medical_eligibility.circom --r1cs --wasm --sym -o build/ -l node_modules

# 2. Trusted setup (larger tau due to increased constraints)
snarkjs powersoftau new bn128 14 build/pot14_0000.ptau -v
snarkjs powersoftau contribute build/pot14_0000.ptau build/pot14_0001.ptau --name="Contribution" -v
snarkjs powersoftau prepare phase2 build/pot14_0001.ptau build/pot14_final.ptau -v
snarkjs groth16 setup build/medical_eligibility.r1cs build/pot14_final.ptau build/medical_eligibility_0000.zkey
snarkjs zkey contribute build/medical_eligibility_0000.zkey build/medical_eligibility_0001.zkey --name="Contribution" -v
snarkjs zkey export verificationkey build/medical_eligibility_0001.zkey build/verification_key.json

# 3. Generate verifier contract (overwrites existing)
snarkjs zkey export solidityverifier build/medical_eligibility_0001.zkey ../contracts/studies/MedicalEligibilityVerifier.sol

# 4. Deploy verifier
cd ..
bun run deploy:verifier

# 5. Copy circuit files to frontend (overwrites existing)
Copy-Item -Path "circuits\build\medical_eligibility_js\medical_eligibility.wasm" -Destination "..\..\apps\web\public\circuits\medical_eligibility.wasm" -Force
Copy-Item -Path "circuits\build\medical_eligibility_0001.zkey" -Destination "..\..\apps\web\public\circuits\medical_eligibility_0001.zkey" -Force
```

---

## 💡 How It Works

### For Studies WITHOUT Bins

```typescript
const result = await generateZKProof(
  medicalData,
  studyCriteria,
  dataCommitment,
  salt,
  challenge
  // No binConfiguration parameter
);

// Circuit receives:
// - numBins = 0
// - All bin arrays filled with zeros

// Circuit outputs:
// - eligible = 1 (if eligible)
// - binMembership[0..49] = [0, 0, 0, ..., 0]  (all zeros)

// Result:
// result.binMembership = undefined (filtered out in proof generator)
```

### For Studies WITH Bins

```typescript
const result = await generateZKProof(
  medicalData,
  studyCriteria,
  dataCommitment,
  salt,
  challenge,
  binConfiguration  // NEW: Pass bin config
);

// Circuit receives:
// - numBins = 5 (for example)
// - binFieldCodes = [0, 1, 4, 3, 9, 0, 0, ...] (padded to 50)
// - binTypes, binMinValues, etc. (all padded to 50)

// Circuit outputs:
// - eligible = 1 (if eligible)
// - binMembership[0..49] = [1, 0, 1, 1, 0, 0, ...] (first 5 show matches, rest are 0)

// Result:
// result.binMembership = {
//   binIds: ["age-40-50", "bmi-25-30", "cholesterol-200-250"],
//   binIndices: [0, 2, 3]
// }
```

---

## 📊 Circuit Structure

```circom
template MedicalEligibility() {
    // Same medical data inputs as before
    signal input age;
    signal input gender;
    // ... etc
    
    // NEW: Bin configuration inputs (optional - set to zeros if no bins)
    signal input numBins;  // 0 for studies without bins
    signal input binFieldCodes[MAX_BINS];
    signal input binTypes[MAX_BINS];
    // ... etc
    
    // Outputs
    signal output eligible;  // Same as before
    signal output binMembership[MAX_BINS];  // NEW: All zeros if numBins = 0
    
    // Original eligibility logic (unchanged)
    // ... eligibility checks ...
    
    // NEW: Bin membership computation
    for (var i = 0; i < MAX_BINS; i++) {
        // Only computes if binIndex < numBins
        // If numBins = 0, all bins are inactive -> all outputs are 0
        binMembership[i] <== binChecks[i].belongs;
    }
}
```

---

## 🎯 Benefits of Single Circuit Approach

### 1. **Simpler Deployment**
- One circuit compilation
- One trusted setup
- One verifier contract
- One set of frontend files

### 2. **Easier Maintenance**
- Single circuit file to update
- No sync issues between two circuits
- Consistent behavior across all studies

### 3. **Backward Compatible**
- Existing studies continue to work (pass `numBins = 0`)
- No breaking changes to current workflow
- Gradual migration to bins

### 4. **Future-Proof**
- All studies will eventually have bins
- No need to deprecate old circuit
- Single upgrade path

### 5. **Smaller Frontend Bundle**
- Only one set of circuit files (~2-3 MB each)
- vs two sets (~4-6 MB total)
- Faster page loads

---

## 📝 Updated Todo List

Since we're using a single circuit, the todos are now simpler:

1. ✅ **Circuit updated** - Extended `medical_eligibility.circom` with bin support
2. ✅ **Proof generator updated** - Single function handles both cases
3. ⏭️ **Compile circuit** - Run circom compilation with larger tau
4. ⏭️ **Deploy verifier** - Deploy updated verifier contract
5. ⏭️ **Copy files** - Copy new .wasm and .zkey to frontend
6. ⏭️ **Update contract calls** - Pass binIds to joinStudy when available
7. ⏭️ **Test both cases** - Test study without bins AND study with bins

---

## 🔍 Public Signals Format

The public signals format is consistent for all studies:

```typescript
publicSignals = [
  dataCommitment,        // [0] - public input
  challenge,             // [1] - public input
  eligible,              // [2] - output (1 or 0)
  binMembership[0],      // [3] - bin 0 (1 or 0)
  binMembership[1],      // [4] - bin 1 (1 or 0)
  // ...
  binMembership[49],     // [52] - bin 49 (1 or 0)
];

// For studies WITHOUT bins: signals [3..52] are all "0"
// For studies WITH bins: signals [3..52] show which bins matched
```

---

## 🧪 Testing Strategy

### Test Case 1: Study WITHOUT Bins (Backward Compatibility)
```typescript
const studyWithoutBins = {
  criteria: { enableAge: 1, minAge: 18, maxAge: 65 },
  // No binConfiguration
};

const result = await generateZKProof(...params);
expect(result.binMembership).toBeUndefined();
expect(result.publicSignals[3]).toBe("0"); // First bin output is 0
expect(result.publicSignals[52]).toBe("0"); // Last bin output is 0
```

### Test Case 2: Study WITH Bins (New Functionality)
```typescript
const studyWithBins = {
  criteria: { enableAge: 1, minAge: 18, maxAge: 65 },
  binConfiguration: {
    bins: [
      { id: "age-40-50", type: "RANGE", criteriaField: "age", ... },
      { id: "gender-male", type: "CATEGORICAL", criteriaField: "gender", ... },
    ]
  }
};

const result = await generateZKProof(...params, binConfiguration);
expect(result.binMembership).toBeDefined();
expect(result.binMembership.binIds.length).toBeGreaterThan(0);
expect(result.publicSignals[3]).toBe("1"); // Participant belongs to first bin
```

---

## 📄 Files Modified

1. `packages/smart-contracts/circuits/medical_eligibility.circom` - Extended with bin logic
2. `apps/web/services/zk/zkProofGenerator.ts` - Enhanced `generateZKProof()` function

## 📄 Files Created

1. `apps/web/services/zk/binMembership.ts` - Bin computation utility
2. `docs/PHASE_3_BIN_CIRCUIT_DEPLOYMENT.md` - Deployment guide (updated for single circuit)
3. `docs/PHASE_3_PROOF_GENERATION.md` - Proof integration guide
4. `docs/PHASE_3_SINGLE_CIRCUIT.md` - This file

---

## ✨ Result

**One circuit. Two modes. Zero complexity.**

All studies use the same circuit. Bins are just optional inputs that activate additional outputs. Clean, simple, and future-proof. 🚀

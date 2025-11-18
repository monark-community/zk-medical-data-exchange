# Phase 3: Proof Generation Integration

This guide explains how to update the proof generation service to work with the new bin-aware circuit.

## 🎯 Goal

Modify the proof generation flow to:
1. Detect if a study has bins configured
2. Compute which bins the participant belongs to (client-side)
3. Pass bin configuration to the circuit as private inputs
4. Extract bin membership from proof's public outputs
5. Return bin IDs to the frontend for contract interaction

---

## 📋 Current Proof Generation Flow

```typescript
// apps/web/services/zk/proofService.ts (simplified)
async function generateEligibilityProof(
  medicalData: MedicalData,
  studyCriteria: StudyCriteria,
  dataCommitment: bigint,
  challenge: bigint
) {
  // 1. Load circuit files
  const wasm = await fetch('/circuits/medical_eligibility.wasm');
  const zkey = await fetch('/circuits/medical_eligibility_0001.zkey');
  
  // 2. Prepare circuit inputs
  const inputs = {
    // Private medical data
    age: medicalData.age,
    gender: medicalData.gender,
    // ... other fields
    
    // Study criteria (private)
    enableAge: studyCriteria.enableAge,
    minAge: studyCriteria.minAge,
    // ... other criteria
    
    // Public inputs
    dataCommitment: dataCommitment.toString(),
    challenge: challenge.toString(),
  };
  
  // 3. Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasm,
    zkey
  );
  
  // 4. Format for contract
  return formatProofForContract(proof, publicSignals);
}
```

---

## 🔧 Updated Flow with Bins

### Step 1: Detect Study Type

```typescript
import type { Study, BinConfiguration } from "@/interfaces";

interface ProofGenerationOptions {
  medicalData: MedicalData;
  studyCriteria: StudyCriteria;
  dataCommitment: bigint;
  challenge: bigint;
  binConfiguration?: BinConfiguration; // NEW: Optional bin config
}

async function generateEligibilityProof(options: ProofGenerationOptions) {
  const hasBins = options.binConfiguration?.bins && 
                  options.binConfiguration.bins.length > 0;
  
  if (hasBins) {
    return generateEligibilityProofWithBins(options);
  } else {
    return generateEligibilityProofOriginal(options);
  }
}
```

---

### Step 2: Compute Bin Membership (Client-Side)

```typescript
import { computeParticipantBins, createBinMembershipBitmap } from "@/services/zk/binMembership";

async function generateEligibilityProofWithBins(options: ProofGenerationOptions) {
  const { medicalData, studyCriteria, dataCommitment, challenge, binConfiguration } = options;
  
  if (!binConfiguration) {
    throw new Error("Bin configuration required");
  }
  
  // Compute which bins the participant belongs to
  const binMembership = computeParticipantBins(medicalData, binConfiguration);
  
  console.log("✅ Participant belongs to bins:", binMembership.binIds);
  console.log("📊 Bin coverage:", binMembership.fieldCoverage);
  
  // ... continue with proof generation
}
```

---

### Step 3: Prepare Circuit Inputs with Bins

```typescript
const MAX_BINS = 50;
const MAX_CATEGORIES_PER_BIN = 10;

function prepareBinCircuitInputs(
  medicalData: MedicalData,
  studyCriteria: StudyCriteria,
  binConfiguration: BinConfiguration,
  dataCommitment: bigint,
  challenge: bigint
) {
  // Convert bin configuration to circuit format
  const numBins = binConfiguration.bins.length;
  
  // Initialize arrays with zeros
  const binFieldCodes = new Array(MAX_BINS).fill(0);
  const binTypes = new Array(MAX_BINS).fill(0);
  const binMinValues = new Array(MAX_BINS).fill(0);
  const binMaxValues = new Array(MAX_BINS).fill(0);
  const binIncludeMin = new Array(MAX_BINS).fill(0);
  const binIncludeMax = new Array(MAX_BINS).fill(0);
  const binCategories = Array.from({ length: MAX_BINS }, () => 
    new Array(MAX_CATEGORIES_PER_BIN).fill(0)
  );
  const binCategoryCount = new Array(MAX_BINS).fill(0);
  
  // Fill with actual bin data
  binConfiguration.bins.forEach((bin, i) => {
    if (i >= MAX_BINS) {
      throw new Error(`Too many bins: ${numBins} (max: ${MAX_BINS})`);
    }
    
    binFieldCodes[i] = getFieldCode(bin.criteriaField);
    binTypes[i] = bin.type === BinType.RANGE ? 0 : 1;
    
    if (bin.type === BinType.RANGE) {
      binMinValues[i] = bin.minValue ?? 0;
      binMaxValues[i] = bin.maxValue ?? 0;
      binIncludeMin[i] = bin.includeMin ? 1 : 0;
      binIncludeMax[i] = bin.includeMax ? 1 : 0;
    } else {
      // Categorical bin
      const categories = bin.categories ?? [];
      binCategoryCount[i] = categories.length;
      
      categories.forEach((cat, j) => {
        if (j < MAX_CATEGORIES_PER_BIN) {
          binCategories[i][j] = cat;
        }
      });
    }
  });
  
  return {
    // Medical data (private)
    age: medicalData.age.toString(),
    gender: medicalData.gender.toString(),
    region: (medicalData.region ?? 0).toString(),
    cholesterol: (medicalData.cholesterol ?? 0).toString(),
    bmi: (medicalData.bmi ?? 0).toString(),
    systolicBP: (medicalData.systolicBP ?? 0).toString(),
    diastolicBP: (medicalData.diastolicBP ?? 0).toString(),
    bloodType: (medicalData.bloodType ?? 0).toString(),
    hba1c: (medicalData.hba1c ?? 0).toString(),
    smokingStatus: (medicalData.smokingStatus ?? 0).toString(),
    activityLevel: (medicalData.activityLevel ?? 0).toString(),
    diabetesStatus: (medicalData.diabetesStatus ?? 0).toString(),
    heartDiseaseHistory: (medicalData.heartDiseaseHistory ?? 0).toString(),
    salt: medicalData.salt.toString(),
    
    // Study criteria (private) - same as before
    enableAge: studyCriteria.enableAge.toString(),
    minAge: studyCriteria.minAge.toString(),
    maxAge: studyCriteria.maxAge.toString(),
    // ... all other criteria fields
    
    // Bin configuration (private)
    numBins: numBins.toString(),
    binFieldCodes: binFieldCodes.map(String),
    binTypes: binTypes.map(String),
    binMinValues: binMinValues.map(String),
    binMaxValues: binMaxValues.map(String),
    binIncludeMin: binIncludeMin.map(String),
    binIncludeMax: binIncludeMax.map(String),
    binCategories: binCategories.map(row => row.map(String)),
    binCategoryCount: binCategoryCount.map(String),
    
    // Public inputs
    dataCommitment: dataCommitment.toString(),
    challenge: challenge.toString(),
  };
}

/**
 * Map field names to circuit field codes
 * 0=age, 1=gender, 2=region, 3=cholesterol, 4=bmi, 5=systolicBP,
 * 6=diastolicBP, 7=bloodType, 8=hba1c, 9=smokingStatus, 10=activityLevel,
 * 11=diabetesStatus, 12=heartDiseaseHistory
 */
function getFieldCode(fieldName: string): number {
  const fieldMap: Record<string, number> = {
    age: 0,
    gender: 1,
    region: 2,
    cholesterol: 3,
    bmi: 4,
    systolicBP: 5,
    diastolicBP: 6,
    bloodType: 7,
    hba1c: 8,
    smokingStatus: 9,
    activityLevel: 10,
    diabetesStatus: 11,
    heartDisease: 12,
  };
  
  const code = fieldMap[fieldName];
  if (code === undefined) {
    throw new Error(`Unknown field: ${fieldName}`);
  }
  
  return code;
}
```

---

### Step 4: Generate Proof with New Circuit

```typescript
async function generateEligibilityProofWithBins(options: ProofGenerationOptions) {
  const { medicalData, studyCriteria, dataCommitment, challenge, binConfiguration } = options;
  
  if (!binConfiguration) {
    throw new Error("Bin configuration required");
  }
  
  console.log("🔧 Generating ZK proof with bin membership...");
  
  // 1. Load NEW circuit files
  const wasmResponse = await fetch('/circuits/medical_eligibility_with_bins.wasm');
  const wasmBuffer = await wasmResponse.arrayBuffer();
  
  const zkeyResponse = await fetch('/circuits/medical_eligibility_with_bins_0001.zkey');
  const zkeyBuffer = await zkeyResponse.arrayBuffer();
  
  // 2. Prepare inputs
  const inputs = prepareBinCircuitInputs(
    medicalData,
    studyCriteria,
    binConfiguration,
    dataCommitment,
    challenge
  );
  
  console.log("📝 Circuit inputs prepared:", {
    numBins: inputs.numBins,
    medicalDataFields: Object.keys(medicalData).length,
  });
  
  // 3. Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    new Uint8Array(wasmBuffer),
    new Uint8Array(zkeyBuffer)
  );
  
  console.log("✅ Proof generated successfully");
  console.log("📊 Public signals:", publicSignals);
  
  // 4. Extract bin membership from public signals
  const binMembershipInfo = extractBinMembershipFromProof(
    publicSignals,
    binConfiguration
  );
  
  // 5. Format for contract
  return {
    proof: formatProofForContract(proof, publicSignals),
    binMembership: binMembershipInfo,
  };
}
```

---

### Step 5: Extract Bin Membership from Proof

```typescript
interface BinMembershipFromProof {
  binIds: string[];           // IDs of bins the participant belongs to
  binIndices: number[];       // Indices in the bin array
  isEligible: boolean;        // Eligibility result from circuit
}

function extractBinMembershipFromProof(
  publicSignals: string[],
  binConfiguration: BinConfiguration
): BinMembershipFromProof {
  // Public signals format from circuit:
  // [0] = dataCommitment (public input, not output)
  // [1] = challenge (public input, not output)
  // [2] = eligible (first output)
  // [3..52] = binMembership[0..49] (50 bin flags)
  
  const isEligible = publicSignals[2] === "1";
  
  const binIds: string[] = [];
  const binIndices: number[] = [];
  
  // Extract bin membership flags
  for (let i = 0; i < binConfiguration.bins.length; i++) {
    const binFlag = publicSignals[3 + i]; // offset by 3 (commitment, challenge, eligible)
    
    if (binFlag === "1") {
      binIds.push(binConfiguration.bins[i].id);
      binIndices.push(i);
    }
  }
  
  console.log(`✅ Participant belongs to ${binIds.length} bins:`, binIds);
  
  return {
    binIds,
    binIndices,
    isEligible,
  };
}
```

---

### Step 6: Return Proof + Bin Membership

```typescript
export interface ZKProofResult {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publicSignals: string[];
  };
  binMembership?: {
    binIds: string[];
    binIndices: number[];
    isEligible: boolean;
  };
}

async function generateEligibilityProofWithBins(
  options: ProofGenerationOptions
): Promise<ZKProofResult> {
  // ... proof generation code from above ...
  
  return {
    proof: formatProofForContract(proof, publicSignals),
    binMembership: binMembershipInfo,
  };
}
```

---

## 🔄 Updated Frontend Flow

### In `apps/web/app/dashboard/page.tsx` (or wherever study application happens):

```typescript
async function handleApplyToStudy(study: Study) {
  try {
    setLoading(true);
    setStatus("Generating ZK proof...");
    
    // 1. Get medical data and commitment
    const medicalData = await getMedicalData();
    const dataCommitment = await computeDataCommitment(medicalData);
    const challenge = await fetchChallenge(); // From backend
    
    // 2. Get study criteria
    const studyCriteria = study.criteria;
    
    // 3. Get bin configuration (if study has bins)
    const binConfiguration = study.binConfiguration;
    
    // 4. Generate proof
    const result = await generateEligibilityProof({
      medicalData,
      studyCriteria,
      dataCommitment,
      challenge,
      binConfiguration, // NEW: Pass bin config
    });
    
    if (!result.binMembership?.isEligible) {
      throw new Error("Not eligible for this study");
    }
    
    setStatus("Submitting application...");
    
    // 5. Submit to blockchain
    const tx = await joinStudyContract({
      studyAddress: study.address,
      proof: result.proof,
      binIds: result.binMembership?.binIds ?? [], // NEW: Pass bin IDs
    });
    
    console.log("✅ Transaction successful:", tx.hash);
    setStatus("Application submitted!");
    
  } catch (error) {
    console.error("❌ Error applying to study:", error);
    setStatus(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

---

## 🧪 Testing

### Test 1: Proof Generation with Bins

```typescript
// Test file: apps/web/services/zk/__tests__/binProofGeneration.test.ts

describe("Bin Proof Generation", () => {
  it("should generate proof with bin membership", async () => {
    const medicalData = {
      age: 45,
      gender: 1,
      bmi: 254, // 25.4
      cholesterol: 200,
      // ... other fields
    };
    
    const binConfig = {
      bins: [
        {
          id: "age-40-50",
          type: BinType.RANGE,
          criteriaField: "age",
          minValue: 40,
          maxValue: 50,
          includeMin: true,
          includeMax: false,
        },
        {
          id: "gender-male",
          type: BinType.CATEGORICAL,
          criteriaField: "gender",
          categories: [1],
        },
        // ... more bins
      ],
    };
    
    const result = await generateEligibilityProof({
      medicalData,
      studyCriteria,
      dataCommitment,
      challenge,
      binConfiguration: binConfig,
    });
    
    expect(result.binMembership?.binIds).toContain("age-40-50");
    expect(result.binMembership?.binIds).toContain("gender-male");
    expect(result.proof.publicSignals).toBeDefined();
  });
});
```

### Test 2: Backward Compatibility

```typescript
it("should work without bins (backward compatible)", async () => {
  const result = await generateEligibilityProof({
    medicalData,
    studyCriteria,
    dataCommitment,
    challenge,
    // No binConfiguration provided
  });
  
  expect(result.proof).toBeDefined();
  expect(result.binMembership).toBeUndefined();
});
```

---

## 🐛 Troubleshooting

### Issue: "Array length mismatch"

**Cause:** Bin arrays not properly padded to MAX_BINS

**Solution:** Ensure all arrays are exactly MAX_BINS length:
```typescript
const binFieldCodes = new Array(MAX_BINS).fill(0);
// Fill only the first numBins elements
```

### Issue: "Circuit input validation failed"

**Cause:** Field code mapping incorrect

**Solution:** Verify getFieldCode() matches circuit's FieldSelector template

### Issue: "Proof generation takes too long"

**Cause:** Circuit is large (50 bins × multiple checks)

**Solution:** 
1. Show progress indicator to user
2. Consider server-side proof generation
3. Optimize circuit (reduce MAX_BINS if possible)

---

## 📝 Next Steps

After implementing proof generation:

1. ✅ Proof service updated to handle bins
2. ✅ Bin membership extracted from public signals
3. ⏭️ Update contract interaction → `PHASE_3_CONTRACT_INTEGRATION.md`
4. ⏭️ Backend verification → `PHASE_3_BACKEND_VERIFICATION.md`
5. ⏭️ End-to-end testing

---

## 🔍 Public Signals Format

Understanding the public signals array is crucial:

```typescript
// Circuit outputs (what becomes publicSignals):
publicSignals = [
  dataCommitment,        // [0] - public input (not output)
  challenge,             // [1] - public input (not output)
  eligible,              // [2] - first actual output (1 or 0)
  binMembership[0],      // [3] - bin 0 (1 or 0)
  binMembership[1],      // [4] - bin 1 (1 or 0)
  // ...
  binMembership[49],     // [52] - bin 49 (1 or 0)
];
```

**Important:** When extracting bins, skip the first 3 elements (2 public inputs + eligible output).

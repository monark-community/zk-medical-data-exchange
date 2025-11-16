# ZK-Preserving Dynamic Binning Implementation Summary

## Overview

Implemented a privacy-preserving data aggregation system using **study-specific dynamic bins** with ZK proofs. This ensures user data privacy while allowing meaningful statistical aggregation.

---

## ✅ What Was Implemented

### 1. **Shared Bin Generation Utilities** (`packages/shared/binDefinitions.ts`)

**Purpose:** Generate study-specific bins using hybrid approach for optimal privacy and medical relevance.

**Key Features:**
- **Hybrid Binning Strategy:**
  - Age/BMI: Equal-width bins (predictable, simple)
  - Cholesterol/HbA1c/BP: Clinical thresholds (medically meaningful)
  - Categorical fields: No binning needed (gender, smoking, etc.)

- **k-Anonymity Protection:**
  ```typescript
  // Automatically determines bin count based on expected participants
  // Ensures each bin likely has ≥5 participants
  const binCount = calculateOptimalBinCount(expectedParticipants, minPerBin = 5);
  ```

- **Clinical Standards:**
  - Cholesterol: AHA guidelines (<200, 200-240, >240)
  - HbA1c: ADA guidelines (<5.7%, 5.7-6.4%, ≥6.5%)
  - BMI: WHO classification (underweight, normal, overweight, obese)
  - BP: AHA categories (normal, elevated, high)

**Functions:**
- `generateStudyBins(criteria, config)` - Main bin generation
- `calculateBinIndex(value, boundaries)` - Client-side bin calculation
- `calculateUserBins(userData, studyBins)` - Calculate all bins for user
- `validateBins(bins, expectedParticipants)` - Validate k-anonymity
- `formatBinsForContract(bins)` - Convert to Solidity-compatible format

---

### 2. **Smart Contract Updates** (`Study.sol`, `StudyFactory.sol`)

**Purpose:** Store bin definitions on-chain for transparency and verifiability.

**Structures Added:**
```solidity
struct BinDefinition {
    bool enabled;
    uint256[10] boundaries;  // Max 10 boundaries = max 9 bins
    uint256 binCount;        // Number of bins
}

struct StudyBins {
    BinDefinition age;
    BinDefinition cholesterol;
    BinDefinition bmi;
    BinDefinition hba1c;
}
```

**Key Changes:**
- Bins stored in `Study` contract (immutable after creation)
- Constructor updated to accept `StudyBins` parameter
- Getter functions added:
  - `getStudyBins()` - Get all bins
  - `getAgeBins()`, `getCholesterolBins()`, etc.
  - `isValidBinIndex(field, binIndex)` - Validate bin assignments

**Security:**
- Bins are public (for transparency)
- Validation prevents invalid bin indices
- Bins can't be changed after study creation (immutability)

---

### 3. **ZK Circuit Updates** (`data_aggregation.circom`, `bin_calculator.circom`)

**Purpose:** Prove correct bin assignment WITHOUT revealing raw values.

**New Helper Template:**
```circom
template CalculateDynamicBin() {
    signal input value;              // Private (e.g., age=35)
    signal input boundaries[6];       // Public (e.g., [20, 30, 40, 50, 60])
    signal input actualBinCount;      // Public (e.g., 4 bins)
    signal output bin;               // Public (e.g., bin=1 for 30-40 range)
    
    // Constrains bin calculation to be correct
    // User can't lie about which bin they belong to
}
```

**Main Circuit Changes:**
- **Inputs:**
  - Private: Raw medical data (age, cholesterol, etc.)
  - Public: Study-specific bin boundaries
  - Public: Bin counts for each metric

- **Outputs:**
  - Public: Bin indices (NOT raw values)
  - Categorical values (gender, smoking, etc.)

- **Constraints:**
  - Data commitment verification (prevents lying)
  - Bin calculation constraints (proves correct binning)

**Privacy Guarantee:**
```
User with age=35, cholesterol=220
↓ (ZK Proof proves correctness)
Public Output: ageBin=1 (30-40), cholesterolBin=1 (200-240)
```

Server sees ONLY bins, never raw values!

---

### 4. **Frontend Integration** (`studyService.ts`)

**Purpose:** Generate bins during study creation.

**Changes:**
```typescript
// In useCreateStudy hook
const bins = generateStudyBins(criteria, {
  expectedParticipants: maxParticipants,
  minParticipantsPerBin: 5
});

// Send to backend with study data
const studyData = { title, description, bins, ... };
```

**Flow:**
1. Researcher sets study criteria (age 20-60, etc.)
2. System generates optimal bins automatically
3. Bins included in study creation request
4. Backend stores bins in database
5. Smart contract deployment includes bins

---

### 5. **Backend API Updates** (`studyController.ts`)

**Purpose:** Handle bin generation and storage.

**Changes:**
- Import bin utilities from `@zk-medical/shared`
- Accept `bins` in create study request
- Generate bins if not provided (fallback)
- Store bins in `bins_json` column

```typescript
const studyBins = providedBins || generateStudyBins(criteria, config);
const insertData = {
  ...
  criteria_json: eligibilityCriteria,
  bins_json: studyBins,  // NEW
  ...
};
```

---

## 🔒 How It Preserves ZK Privacy

### Problem We Solved:
**Before:** Hardcoded bins didn't match study criteria (e.g., study wants age 20-50, but circuit uses global bins 0-20, 20-30, ...)

**After:** Study-specific bins that adapt to criteria while preserving privacy.

### Privacy Mechanism:

1. **Client-Side Binning:**
   ```
   User's Browser (Private)
   - Raw Data: age=35, cholesterol=220
   - Fetch Study Bins: age[20,30,40,50], chol[200,240]
   - Calculate Bins: ageBin=1, cholBin=1
   - Generate ZK Proof: Proves calculation is correct
   ```

2. **ZK Proof Constraints:**
   ```circom
   // Circuit proves:
   // 1. Raw data matches commitment (can't lie)
   // 2. Bin assignment is correct (can't cheat)
   // 3. Only bin indices are revealed (privacy)
   ```

3. **Smart Contract Validation:**
   ```solidity
   // Verifies:
   // 1. ZK proof is valid
   // 2. Bin indices match study definition
   // 3. Data commitment matches enrollment
   ```

### Attack Prevention:

| Attack | Prevention |
|--------|-----------|
| User claims wrong bin | ❌ ZK proof fails (circuit constrains calculation) |
| User uses different data | ❌ Data commitment mismatch |
| User submits to wrong study | ❌ studyId in proof |
| Study creator leaks privacy | ✅ Automatic bin count based on size |
| Double submission | ✅ Track by wallet address |

---

## 📊 Bin Examples

### Example Study: Diabetes Research (age 30-70, 100 participants)

**Generated Bins:**
```json
{
  "age": {
    "enabled": true,
    "boundaries": [30, 40, 50, 60, 70],
    "binCount": 4,
    "labels": ["30-40", "40-50", "50-60", "60-70"],
    "type": "equal-width"
  },
  "cholesterol": {
    "enabled": true,
    "boundaries": [150, 200, 240, 300],
    "binCount": 3,
    "labels": ["150-200", "200-240 (Borderline)", "240-300 (High)"],
    "type": "clinical"
  },
  "hba1c": {
    "enabled": true,
    "boundaries": [50, 57, 65, 80],
    "binCount": 3,
    "labels": ["<5.7% (Normal)", "5.7-6.5% (Prediabetic)", "≥6.5% (Diabetic)"],
    "type": "clinical"
  }
}
```

**Participant Data:**
- Raw (Private): age=45, cholesterol=230, hba1c=62
- ZK Output (Public): ageBin=1, cholesterolBin=1, hba1cBin=1

**Aggregated Results:**
```
Age Distribution:
- 30-40: 18 participants
- 40-50: 32 participants  ← Our user is here
- 50-60: 28 participants
- 60-70: 22 participants

Cholesterol Distribution:
- 150-200: 25 participants
- 200-240: 45 participants  ← Our user is here
- 240-300: 30 participants
```

**Privacy Level:** Each bin has 18-45 participants → Excellent k-anonymity (k ≥ 18)

---

## 🚀 Next Steps (Not Yet Implemented)

### 5. **Client-Side Proof Generation** (TODO)
Update `apps/web/services/zk/` to:
- Fetch study bins from smart contract
- Calculate bin indices locally
- Pass bin boundaries to ZK proof generator
- Include dynamic bins in proof inputs

### 6. **Backend Aggregation Service** (TODO)
Update `zkDataAggregationService.ts` to:
- Validate bin indices against study bins
- Aggregate counts per bin
- Generate statistics with bin labels
- Enforce k-anonymity checks

---

## 📝 Database Schema Update Needed

Add column to `studies` table:
```sql
ALTER TABLE studies 
ADD COLUMN bins_json JSONB;

-- Index for fast bin lookups
CREATE INDEX idx_studies_bins ON studies USING GIN (bins_json);
```

---

## 🎯 Key Benefits

1. **Privacy:** Raw data never leaves user's device
2. **Integrity:** ZK proofs prevent cheating
3. **Flexibility:** Study-specific bins adapt to criteria
4. **Medical Relevance:** Clinical thresholds align with standards
5. **k-Anonymity:** Automatic bin sizing ensures group privacy
6. **Transparency:** Bins are public and verifiable
7. **Immutability:** Bins can't change after study creation

---

## 📖 Developer Guide

### Creating a Study with Bins:

```typescript
import { generateStudyBins } from '@zk-medical/shared';

const criteria = {
  enableAge: 1,
  minAge: 20,
  maxAge: 60,
  enableCholesterol: 1,
  minCholesterol: 150,
  maxCholesterol: 300,
  // ... other criteria
};

const bins = generateStudyBins(criteria, {
  expectedParticipants: 100,
  minParticipantsPerBin: 5
});

// bins auto-generated with optimal k-anonymity
```

### User Participating:

```typescript
import { calculateUserBins } from '@zk-medical/shared';

// 1. Fetch study bins
const studyBins = await contract.getStudyBins();

// 2. Calculate bin indices
const userBins = calculateUserBins(
  { age: 35, cholesterol: 220, ... },
  studyBins
);

// 3. Generate ZK proof (TODO: update proof generator)
const proof = await generateZKProof({
  privateInputs: userData,
  publicInputs: {
    studyBins,
    calculatedBins: userBins
  }
});
```

---

## 🔐 Security Considerations

1. **Bin Boundaries are Public:** This is intentional for transparency
2. **Minimum Bin Size:** Always validate ≥5 participants per bin
3. **Immutable Bins:** Once set, bins can't change (prevents gaming)
4. **Circuit Constraints:** Bin calculation is cryptographically constrained
5. **Commitment Binding:** Proofs tied to enrollment data commitment

---

## 📚 References

- Clinical Thresholds:
  - Cholesterol: American Heart Association
  - HbA1c: American Diabetes Association
  - BMI: World Health Organization
  - BP: American Heart Association

- Privacy Concepts:
  - k-Anonymity: Sweeney, 2002
  - Differential Privacy: Dwork, 2006
  - Zero-Knowledge Proofs: Goldwasser, Micali, Rackoff, 1985

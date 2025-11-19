# Bin ID System - Sequential Numbering Implementation

## Problem Solved

The bin identifier needed to be:
- **Human-readable** for debugging and display (e.g., "age_bin_0")
- **uint256 compatible** for blockchain storage and ZK proofs

**Previous Issue:** String IDs like `"age_bin_0"` couldn't be converted to `BigInt` for blockchain transactions.

**Solution:** Sequential numbering - each bin gets both a string ID (for humans) and a numeric ID (for blockchain).

---

## Implementation

### 1. Updated `DataBin` Interface

**File:** `packages/shared/dataBins.ts`

```typescript
export interface DataBin {
  id: string;           // Human-readable: "age_bin_0", "gender_bin_1"
  numericId: number;    // Sequential: 0, 1, 2, 3, ...
  criteriaField: string;
  type: BinType;
  label: string;
  // ... rest of fields
}
```

### 2. Updated Bin Generation

**File:** `packages/shared/binningAlgorithm.ts`

```typescript
export function generateBinsFromCriteria(...): BinConfiguration {
  const bins: DataBin[] = [];
  let globalBinIndex = 0; // Sequential counter across ALL bins
  
  Object.values(BinnableField).forEach((field) => {
    if (criteria[enableFlag] === 1) {
      if (metadata.type === BinType.RANGE) {
        const rangeBins = generateRangeBins(
          field, criteria, metadata, fullConfig, globalBinIndex
        );
        globalBinIndex += rangeBins.length; // Increment global counter
        bins.push(...rangeBins);
      }
      // ... similar for categorical bins
    }
  });
  
  return { bins };
}
```

Each bin gets:
- `id`: `"${field}_bin_${localIndex}"` (e.g., "age_bin_0", "age_bin_1")
- `numericId`: `globalBinIndex + localIndex` (e.g., 0, 1, 2, 3, ...)

### 3. Updated Smart Contract Interface

**File:** `apps/api/src/utils/binConversion.ts`

```typescript
export interface SolidityDataBin {
  binId: bigint;        // Changed from string to bigint
  criteriaField: string;
  binType: number;
  label: string;
  // ... rest of fields
}

export function convertBinsForSolidity(binConfig: BinConfiguration): SolidityDataBin[] {
  return binConfig.bins.map((bin: DataBin) => ({
    binId: BigInt(bin.numericId), // ✅ Use numeric ID for blockchain
    // ... rest of conversion
  }));
}
```

### 4. Helper Functions Added

**File:** `apps/api/src/utils/binConversion.ts`

```typescript
// Create mapping from string ID → numeric ID
export function createBinIdMap(binConfig: BinConfiguration): Map<string, number> {
  const map = new Map<string, number>();
  binConfig.bins.forEach((bin) => {
    map.set(bin.id, bin.numericId);
  });
  return map;
}

// Convert array of string IDs to numeric IDs
export function convertStringBinIdsToNumeric(
  stringBinIds: string[],
  binConfig: BinConfiguration
): number[] {
  const map = createBinIdMap(binConfig);
  return stringBinIds
    .map((stringId) => map.get(stringId))
    .filter((numericId): numericId is number => numericId !== undefined);
}
```

### 5. Updated Bin Membership Results

**File:** `apps/web/services/zk/binMembership.ts`

```typescript
export interface BinMembershipResult {
  binIds: string[];        // ["age_bin_0", "gender_bin_1"]
  numericBinIds: number[]; // [0, 3]
  binIndices: number[];    // [0, 3]
  binCount: number;
  fieldCoverage: Record<string, boolean>;
}

export function computeParticipantBins(...): BinMembershipResult {
  const binIds: string[] = [];
  const numericBinIds: number[] = [];
  
  binConfig.bins.forEach((bin, index) => {
    if (checkBinMembership(userData, bin)) {
      binIds.push(bin.id);              // String ID for display
      numericBinIds.push(bin.numericId); // Numeric ID for blockchain
      binIndices.push(index);
    }
  });
  
  return { binIds, numericBinIds, binIndices, ... };
}
```

### 6. Updated ZK Proof Results

**File:** `apps/web/services/zk/zkProofGenerator.ts`

```typescript
export interface ZKProofResult {
  proof: ZKProof;
  publicSignals: string[];
  isEligible: boolean;
  binMembership?: {
    binIds: string[];        // For display
    numericBinIds: number[]; // For blockchain
    binIndices: number[];
  };
}

function extractBinMembershipFromProof(...): {
  binIds: string[];
  numericBinIds: number[];
  binIndices: number[];
} {
  for (let i = 0; i < binConfiguration.bins.length; i++) {
    if (publicSignals[3 + i] === "1") {
      binIds.push(binConfiguration.bins[i].id);
      numericBinIds.push(binConfiguration.bins[i].numericId); // ✅ Extract numeric ID
      binIndices.push(i);
    }
  }
  return { binIds, numericBinIds, binIndices };
}
```

---

## How It Works

### Example: Study with 3 Age Bins and 2 Gender Bins

**Bin Generation:**
```
Age bins (range):
  - id: "age_bin_0",    numericId: 0  →  Ages 10-20
  - id: "age_bin_1",    numericId: 1  →  Ages 21-30
  - id: "age_bin_2",    numericId: 2  →  Ages 31-40

Gender bins (categorical):
  - id: "gender_bin_0", numericId: 3  →  Male
  - id: "gender_bin_1", numericId: 4  →  Female
```

**Blockchain Storage:**
```solidity
struct DataBin {
    uint256 binId;        // 0, 1, 2, 3, 4
    string criteriaField; // "age", "age", "age", "gender", "gender"
    string label;         // "Ages 10-20", "Ages 21-30", etc.
    // ...
}

mapping(uint256 => uint256) public binCounts;
// binCounts[0] = 5  (5 participants age 10-20)
// binCounts[1] = 8  (8 participants age 21-30)
// binCounts[3] = 20 (20 male participants)
```

**Patient Data Flow:**
```
Patient: age 25, male

1. Frontend computes bin membership:
   ✅ Belongs to "age_bin_1" (numericId: 1)
   ✅ Belongs to "gender_bin_0" (numericId: 3)

2. ZK Proof includes:
   binMembership: {
     binIds: ["age_bin_1", "gender_bin_0"],
     numericBinIds: [1, 3],
     binIndices: [1, 3]
   }

3. Backend sends to blockchain:
   joinStudy(proof, ..., binIds: [1, 3])

4. Smart contract updates:
   binCounts[1]++  (age 21-30 count: 8 → 9)
   binCounts[3]++  (male count: 20 → 21)
```

---

## Files Changed

### Core Library (Shared)
1. ✅ `packages/shared/dataBins.ts` - Added `numericId` to `DataBin` interface
2. ✅ `packages/shared/binningAlgorithm.ts` - Sequential ID generation in both functions

### Frontend (Web)
3. ✅ `apps/web/services/zk/binMembership.ts` - Track both string and numeric IDs
4. ✅ `apps/web/services/zk/zkProofGenerator.ts` - Extract both ID types from proof

### Backend (API)
5. ✅ `apps/api/src/utils/binConversion.ts` - Convert numeric IDs to BigInt for blockchain

---

## Benefits

### ✅ Type Safety
- No more string→BigInt conversion errors
- Compiler enforces numeric IDs exist

### ✅ Human Readable
- String IDs still available for debugging
- Logs show `"age_bin_0"` not just `0`

### ✅ Sequential & Deterministic
- Same bin always gets same numeric ID
- Easy to track: bin 0, bin 1, bin 2, ...

### ✅ Blockchain Compatible
- `uint256` numeric IDs work perfectly with Solidity
- No hash collisions
- Efficient storage

---

## Migration Notes

**No database migration needed** - bins are generated fresh for each study.

**If you have existing studies in the database:**
- Old bins may not have `numericId`
- Solution: Regenerate bin configuration when fetching study details
- Or: Add migration to assign sequential IDs to existing bins

---

## Testing Checklist

- [ ] Generate bins for a new study - verify `numericId` is assigned
- [ ] Patient joins study - verify numeric IDs are sent to blockchain
- [ ] Check blockchain logs - bin counts increment for correct numeric IDs
- [ ] Frontend displays - verify string IDs still shown to users
- [ ] API logs - verify both ID types are logged for debugging

---

## Next Steps

1. **Test bin generation** - Create a study and verify bins have both IDs
2. **Test patient join** - Verify numeric IDs are used in blockchain transaction
3. **Check logs** - Ensure both ID types appear in backend logs
4. **Verify blockchain** - Confirm bin counts increment correctly

The system now has a clean separation:
- **String IDs** for humans (display, debugging, logs)
- **Numeric IDs** for machines (blockchain, ZK proofs, storage)

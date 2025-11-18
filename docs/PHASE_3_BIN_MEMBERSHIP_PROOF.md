# Phase 3: ZK Bin Membership Proof Implementation

## Overview

This phase extends the ZK proof system to include privacy-preserving bin membership proofs. Participants prove which bins they belong to **without revealing their actual medical data**.

## Security Model

### Privacy Guarantees
1. **Data Privacy**: Raw medical values never leave the client
2. **Commitment Binding**: Proof tied to original data commitment (prevents cheating)
3. **Bin Privacy**: Individual bin membership not queryable (only aggregates)
4. **K-Anonymity**: Minimum 5 participants per bin enforced

### Attack Prevention
1. **Data Manipulation**: Commitment binding ensures user can't change data after registration
2. **Bin Gaming**: ZK circuit verifies bin membership matches actual data
3. **Replay Attacks**: Challenge nonce ensures freshness
4. **Researcher Re-identification**: Individual bin queries blocked at contract level

## Architecture

### Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. STUDY CREATION (Already Implemented)                     │
│                                                              │
│ Frontend → Generate Bins → Store in DB → Deploy Contract    │
│                     ↓                            ↓           │
│            BinConfiguration          configureBins()         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. PARTICIPANT APPLICATION (Phase 3 - To Implement)          │
│                                                              │
│ a) Fetch Study Bins                                         │
│    GET /api/studies/:id → binConfiguration                  │
│                                                              │
│ b) Compute Bin Membership (Client-side)                     │
│    computeParticipantBins(userData, binConfig)              │
│    → ["age_bin_2", "gender_bin_0", "bmi_bin_1"]            │
│                                                              │
│ c) Generate ZK Proof                                        │
│    Circuit inputs:                                           │
│    - Private: age, gender, bmi, ... (medical data)          │
│    - Private: study criteria                                │
│    - Private: bin ranges/categories                         │
│    - Public: dataCommitment, challenge                      │
│    - Public: binMembershipHashes (derived from binIds)      │
│                                                              │
│    Circuit logic:                                            │
│    - Verify data matches commitment                         │
│    - Check eligibility criteria                             │
│    - Compute which bins data belongs to                     │
│    - Hash bin IDs and output as public signals              │
│                                                              │
│ d) Submit to Blockchain                                     │
│    joinStudy(proof, commitment, challenge, binIds[])        │
│    → Contract verifies proof                                │
│    → Contract increments binCounts[binId]                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. AGGREGATE STATISTICS (Phase 4 - Future)                  │
│                                                              │
│ Researcher Dashboard → GET /api/studies/:id/statistics      │
│    → Returns: { "age_bin_0": 12, "age_bin_1": 18, ... }    │
│    → No individual data, only counts                        │
└─────────────────────────────────────────────────────────────┘
```

## Circuit Design: Bin Membership Proof

### Approach: Hash-Based Bin Verification

Instead of outputting bin IDs directly (which would bloat the circuit), we:
1. **Compute bin membership** inside the circuit
2. **Hash the bin IDs** that the participant belongs to
3. **Output the hash** as a public signal
4. **Frontend provides bin IDs** to the contract
5. **Contract verifies** the hash matches

This approach:
- ✅ Keeps circuit size manageable
- ✅ Prevents bin ID manipulation
- ✅ Allows flexible number of bins per study

### Circuit Extensions

```circom
// NEW: Bin membership outputs
signal output binMembershipHash;  // Hash of all bin IDs user belongs to

// NEW: Private inputs for bin configuration
signal input numBins;  // Total number of bins in study
signal input binFields[MAX_BINS];  // Which field each bin checks (0=age, 1=gender, ...)
signal input binTypes[MAX_BINS];   // 0=RANGE, 1=CATEGORICAL
signal input binMinValues[MAX_BINS];
signal input binMaxValues[MAX_BINS];
signal input binCategoryBitmaps[MAX_BINS];

// NEW: Bin membership computation
component binChecker[MAX_BINS];
signal binMembership[MAX_BINS];  // 1 if user belongs to bin i, 0 otherwise

// For each bin, check if user's data matches
for (var i = 0; i < MAX_BINS; i++) {
    binChecker[i] = CheckBinMembership();
    binChecker[i].field <== binFields[i];
    binChecker[i].binType <== binTypes[i];
    binChecker[i].minValue <== binMinValues[i];
    binChecker[i].maxValue <== binMaxValues[i];
    binChecker[i].categoryBitmap <== binCategoryBitmaps[i];
    
    // Pass actual user data based on field type
    binChecker[i].age <== age;
    binChecker[i].gender <== gender;
    binChecker[i].bmi <== bmi;
    // ...
    
    binMembership[i] <== binChecker[i].belongs;
}

// Hash the bin membership array
component membershipHasher = Poseidon(MAX_BINS);
for (var i = 0; i < MAX_BINS; i++) {
    membershipHasher.inputs[i] <== binMembership[i];
}
binMembershipHash <== membershipHasher.out;
```

### Alternative: Direct Bin ID Outputs (Simpler)

**Pros**: No hashing complexity, contract directly receives bin IDs  
**Cons**: Circuit size grows with number of bins

```circom
// Maximum bins supported (compile-time constant)
var MAX_BINS = 50;

signal output participantBinCount;  // How many bins user belongs to
signal output participantBinIndices[MAX_BINS];  // Which bins (0/1 flags)

// Example: User belongs to bins 0, 3, 7
// participantBinCount = 3
// participantBinIndices = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, ...]
```

**RECOMMENDATION**: Start with **Alternative (Direct Bin ID Outputs)** for simplicity. We can optimize to hash-based approach if circuit becomes too large.

## Implementation Tasks

### 1. Circuit Extension (Circom)

**File**: `packages/smart-contracts/circuits/medical_eligibility_with_bins.circom`

**Changes**:
- Add bin configuration inputs (private)
- Add bin membership computation logic
- Output bin membership flags (public)
- Ensure backward compatibility

**Complexity**: Medium (3-4 hours)

### 2. Frontend Bin Computation

**File**: `apps/web/services/zk/binMembership.ts` (new)

**Purpose**: Compute which bins the user belongs to before generating proof

```typescript
export function computeParticipantBins(
  userData: MedicalData,
  binConfig: BinConfiguration
): string[] {
  const binIds: string[] = [];
  
  for (const bin of binConfig.bins) {
    if (bin.type === BinType.RANGE) {
      const value = userData[bin.criteriaField];
      if (value >= bin.minValue && value < bin.maxValue) {
        binIds.push(bin.id);
      }
    } else if (bin.type === BinType.CATEGORICAL) {
      const value = userData[bin.criteriaField];
      if (bin.categories.includes(value)) {
        binIds.push(bin.id);
      }
    }
  }
  
  return binIds;
}
```

**Complexity**: Low (1 hour)

### 3. Proof Generation Update

**File**: `apps/web/services/zk/proofGenerator.ts`

**Changes**:
- Accept `binConfig` parameter
- Pass bin data to circuit as private inputs
- Extract bin membership outputs from proof

**Complexity**: Medium (2 hours)

### 4. Contract Call Update

**File**: `apps/web/hooks/useStudies.ts` or join study component

**Changes**:
- Compute bin IDs before proof generation
- Pass `binIds[]` to `joinStudy()` contract call

**Complexity**: Low (1 hour)

### 5. Backend Verification (Optional)

**File**: `apps/api/src/controllers/studyController.ts`

**Changes**:
- Verify bin IDs match study configuration
- Log bin assignment for audit trail

**Complexity**: Low (1 hour)

## Testing Strategy

### Unit Tests
1. **Bin membership computation**: Test edge cases (boundaries, categorical matches)
2. **Circuit constraints**: Verify bin logic is correct
3. **Proof generation**: Ensure binIds are extracted correctly

### Integration Tests
1. **End-to-end flow**: Create study → Apply → Verify binCounts updated
2. **Security tests**: Try to submit invalid bin IDs, manipulated proofs
3. **Privacy tests**: Confirm individual bin membership not queryable

### Manual Testing Checklist
- [ ] Create study with mixed range/categorical bins
- [ ] Apply with data matching multiple bins
- [ ] Apply with data matching no bins (should fail eligibility)
- [ ] Check binCounts updated correctly on contract
- [ ] Revoke consent → binCounts decremented
- [ ] Re-grant consent → binCounts re-incremented

## Security Considerations

### Commitment Binding
- User cannot change medical data after registering commitment
- Proof must use same data that generated commitment
- Challenge nonce prevents proof reuse

### Bin Integrity
- Circuit verifies bin membership based on actual data
- User cannot claim membership in arbitrary bins
- Contract validates bin IDs exist in study configuration

### Privacy Guarantees
- Individual bin membership stored in `participantBins[address]` (private mapping)
- Only aggregate counts exposed via `binCounts[binId]` (public)
- Minimum participant threshold (k=5) enforced before revealing statistics

## Performance Considerations

### Circuit Size
- **MAX_BINS = 50**: ~100K constraints (acceptable)
- **MAX_BINS = 100**: ~200K constraints (may need optimization)
- **Optimization**: Use hash-based approach if needed

### Proof Generation Time
- Current: ~3-5 seconds
- With bins: ~5-8 seconds (acceptable for medical use case)

### Gas Costs
- Additional gas for `binIds[]` array: ~50K per bin
- Total for 5 bins: ~250K gas (~$2 at current prices)

## Migration Path

### Backward Compatibility
1. Studies without bins work as before (binIds = empty array)
2. Existing circuit remains functional
3. New circuit is optional enhancement

### Deployment Steps
1. Deploy new circuit (parallel to existing)
2. Update frontend to detect bin support
3. If study has bins → use new circuit
4. If study has no bins → use old circuit
5. Gradual rollout, no breaking changes

## Next Steps

1. ✅ Complete Phase 3a: Circuit extension
2. ✅ Complete Phase 3b: Frontend bin computation
3. ✅ Complete Phase 3c: Proof generation update
4. ✅ Complete Phase 3d: Contract integration
5. ⏭️ Phase 4: Researcher dashboard with aggregate statistics

## Questions for Discussion

1. **Circuit Approach**: Direct bin outputs vs. hash-based? (Recommendation: Direct for simplicity)
2. **MAX_BINS**: Set to 50 or 100? (Recommendation: 50, can increase later)
3. **Bin Validation**: Should contract validate bin IDs exist? (Recommendation: Yes, prevent errors)
4. **Backward Compatibility**: Support both circuits or migrate all? (Recommendation: Support both)

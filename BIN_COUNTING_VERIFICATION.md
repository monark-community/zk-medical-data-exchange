# Bin Counting System - Verification Guide

## Overview
This document helps verify that study bins are being updated correctly when patients join a study. The system uses Zero-Knowledge Proofs to privately determine which bins a participant belongs to, then increments those bin counts on the blockchain.

## System Flow

### 1. **Bin Configuration (Study Creation)**
- **Location**: `Study.sol` - `configureBins()` function
- **Process**: Researcher creates bins (e.g., "ages 10-20", "ages 21-30")
- **Storage**: Bins stored in `DataBin[] public bins` array on contract
- **Key Point**: Must be done BEFORE any participants join

### 2. **Bin Membership Calculation (Client-Side)**
- **Location**: `apps/web/services/zk/binMembership.ts` - `computeParticipantBins()`
- **Process**: 
  - User enters medical data (e.g., age = 15)
  - System checks which bins match the user's data
  - For age 15 with a bin "10-20", this returns `binIds: ["age_bin_0"]`
- **Key Point**: This runs in the browser BEFORE proof generation

### 3. **ZK Proof Generation**
- **Location**: `apps/web/services/zk/zkProofGenerator.ts` - `generateZKProof()`
- **Process**:
  - Generates proof that user meets study criteria
  - Includes bin membership in public signals (positions 3-52)
  - Each bin flag is 0 or 1 (1 = participant belongs to this bin)
- **Key Point**: Bin membership is proven without revealing actual medical data

### 4. **Backend Processing**
- **Location**: `apps/api/src/services/studyService.ts` - `recordParticipation()`
- **Process**:
  - Receives proof with binIds array
  - Converts binIds from proof's public signals (first 50 signals)
  - Passes to blockchain transaction
- **Code**:
```typescript
// Line 970-977 in studyService.ts
let binIdsFromPubSignals = pubSignals.length > 1 
  ? pubSignals.slice(0, 50)  // First 50 public signals are bin membership flags
  : []; 

const result = await this.executeContractTransaction(
  studyAddress,
  "joinStudy",
  [pA, pB, pC, commitment, challengeBytes32, participantWallet, binIdsFromPubSignals],
  "Participation recording"
);
```

### 5. **Smart Contract - Bin Count Update**
- **Location**: `packages/smart-contracts/contracts/studies/Study.sol`
- **Function**: `joinStudy()` → `_updateBinCounts()`
- **Process**:

```solidity
// Lines 163-201 in Study.sol
function joinStudy(
    uint[2] calldata _pA,
    uint[2][2] calldata _pB,
    uint[2] calldata _pC,
    uint256 dataCommitment,
    bytes32 challenge,
    address participant,
    uint256[] memory binIds  // ← Array of bin IDs participant belongs to
) external {
    // ... verification code ...
    
    // THIS IS THE KEY LINE - updates bin counts
    _updateBinCounts(participant, binIds, true);
    
    emit ParticipantJoined(participant, dataCommitment);
}

// Lines 207-225
function _updateBinCounts(
    address participant,
    uint256[] memory binIds,
    bool increment
) private {
    for (uint256 i = 0; i < binIds.length; i++) {
        uint256 binId = binIds[i];
        
        if (increment) {
            binCounts[binId]++;  // ← INCREMENT HAPPENS HERE
            participantBins[participant].push(binId);
            emit BinCountUpdated(binId, binCounts[binId]);  // ← Event emitted
        } else {
            if (binCounts[binId] > 0) {
                binCounts[binId]--;
                emit BinCountUpdated(binId, binCounts[binId]);
            }
        }
    }
}
```

## Verification Steps

### Step 1: Check Bin Configuration
Verify bins are set up correctly for a study:

```typescript
// In browser console or test
const bins = await studyContract.read.getBins();
console.log("Configured bins:", bins);
// Should show bins like:
// [{ binId: 0, criteriaField: "age", minValue: 10, maxValue: 20, ... }]
```

### Step 2: Monitor Bin Count BEFORE Join
```typescript
const binCountBefore = await studyContract.read.getBinCount([0]); // For binId 0
console.log("Bin count before:", binCountBefore);
// Should be 0 initially, or current count
```

### Step 3: Patient Joins Study
When a patient with age 15 joins:
1. Client calculates they belong to bin 0 (ages 10-20)
2. Proof is generated with `binIds = [0]`
3. Transaction is sent to `joinStudy()` with `binIds = [0]`

### Step 4: Monitor Bin Count AFTER Join
```typescript
const binCountAfter = await studyContract.read.getBinCount([0]);
console.log("Bin count after:", binCountAfter);
// Should be binCountBefore + 1
```

### Step 5: Check Event Logs
```typescript
// Check for BinCountUpdated event
const events = await studyContract.getEvents.BinCountUpdated({
  binId: 0n
});
console.log("Bin count update events:", events);
// Should show event with newCount = binCountAfter
```

## Debugging Checklist

If bin counts are NOT incrementing:

### ✅ Frontend Issues
- [ ] **Check bin membership calculation**
  ```typescript
  // In apps/web/services/zk/binMembership.ts
  const result = computeParticipantBins(medicalData, binConfiguration);
  console.log("Bins matched:", result.binIds);
  ```
  - Should return array of bin IDs (e.g., `[0, 2, 5]`)
  
- [ ] **Check proof generation**
  ```typescript
  // In apps/web/services/zk/zkProofGenerator.ts
  console.log("Bin membership in proof:", proofResult.binMembership);
  ```
  - Should include `{ binIds: [...], binIndices: [...] }`

### ✅ Backend Issues
- [ ] **Check binIds received**
  ```typescript
  // In apps/api/src/services/studyService.ts (line 798)
  console.log("Received binIds:", binIds);
  ```
  - Should be non-empty array

- [ ] **Check binIds conversion**
  ```typescript
  // Line 957-966
  console.log("Converted bigintBinIds:", bigintBinIds);
  ```
  - Should match original binIds

- [ ] **Check public signals extraction**
  ```typescript
  // Line 970-973
  console.log("binIdsFromPubSignals:", binIdsFromPubSignals);
  ```
  - Should be array of 50 values (0 or 1)

### ✅ Smart Contract Issues
- [ ] **Check binIds parameter**
  ```solidity
  // Add console.log in Study.sol joinStudy() function
  console.log("binIds length:", binIds.length);
  ```
  - Should be > 0 if participant belongs to any bins

- [ ] **Check _updateBinCounts execution**
  ```solidity
  // Add console.log in _updateBinCounts
  console.log("Incrementing bin:", binId);
  console.log("New count:", binCounts[binId]);
  ```

## Expected Behavior Example

**Scenario**: Study has bins for age ranges
- Bin 0: ages 10-20
- Bin 1: ages 21-30
- Bin 2: ages 31-40

**Patient Data**: age = 15

**Expected Flow**:
1. ✅ Client: `computeParticipantBins()` returns `{ binIds: [0] }`
2. ✅ Client: Proof generated with bin membership flag at position 3 = 1 (rest = 0)
3. ✅ Backend: Extracts `binIds = [0]` from public signals
4. ✅ Contract: `joinStudy()` called with `binIds = [0]`
5. ✅ Contract: `_updateBinCounts()` increments `binCounts[0]++`
6. ✅ Contract: Emits `BinCountUpdated(0, newCount)`
7. ✅ State: `binCounts[0]` increased by 1

## Common Issues & Solutions

### Issue 1: Bin count stays at 0
**Cause**: binIds array is empty  
**Solution**: Check bin membership calculation - ensure user's medical data matches bin criteria

### Issue 2: Wrong bins incremented
**Cause**: Bin ID mismatch between frontend and contract  
**Solution**: Verify bin IDs are consistent (use numeric IDs, not string names)

### Issue 3: Multiple bins incremented when expecting one
**Cause**: User matches multiple bin criteria  
**Solution**: This is correct behavior - one participant can belong to multiple bins (e.g., age bin AND gender bin)

### Issue 4: Bin counts not visible
**Cause**: Reading from wrong contract address  
**Solution**: Verify you're querying the correct study contract address

## Testing Script

```typescript
// Quick test to verify bin counting
async function testBinCounting(studyAddress: string) {
  const studyContract = getContract({
    address: studyAddress,
    abi: STUDY_ABI,
  });
  
  // 1. Get initial bin counts
  const allBins = await studyContract.read.getBins();
  console.log(`Study has ${allBins.length} bins configured`);
  
  const initialCounts = await studyContract.read.getAllBinCounts();
  console.log("Initial bin counts:", initialCounts);
  
  // 2. Patient joins (this happens through normal flow)
  // ... patient application process ...
  
  // 3. Check updated bin counts
  const updatedCounts = await studyContract.read.getAllBinCounts();
  console.log("Updated bin counts:", updatedCounts);
  
  // 4. Verify increment
  for (let i = 0; i < initialCounts.length; i++) {
    const initial = initialCounts[i].count;
    const updated = updatedCounts[i].count;
    if (updated > initial) {
      console.log(`✅ Bin ${initialCounts[i].binId} incremented: ${initial} → ${updated}`);
    }
  }
}
```

## Summary

The bin counting system works as follows:
1. **Client determines** which bins the participant belongs to
2. **ZK Proof includes** bin membership (without revealing medical data)
3. **Smart contract receives** bin IDs and increments those specific bins
4. **Counts are stored** on-chain in `mapping(uint256 => uint256) public binCounts`

**Key Files**:
- Frontend calculation: `apps/web/services/zk/binMembership.ts`
- Proof generation: `apps/web/services/zk/zkProofGenerator.ts`
- Backend processing: `apps/api/src/services/studyService.ts`
- Smart contract: `packages/smart-contracts/contracts/studies/Study.sol`

**The system IS designed to work** - bin counts increment automatically when `joinStudy()` is called with the correct `binIds` array.

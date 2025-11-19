# Comprehensive Bin Counting Logging - Added

This document summarizes all the logging that has been added to help verify bin configuration and bin count updates throughout the system.

## 🎯 Overview

Logging has been added at **two critical points**:
1. **When a researcher creates a study and configures bins** (initializes bins on blockchain)
2. **When a patient joins a study** (increments bin counts on blockchain)

---

## 📊 Smart Contract Events (Study.sol)

### New Events Added

```solidity
// Detailed logging events for bin operations
event BinConfigurationStarted(address indexed caller, uint256 binCount);
event BinConfigured(uint256 indexed index, uint256 binId, string criteriaField, string label, uint8 binType);
event BinUpdateStarted(address indexed participant, uint256 binCount, bool increment);
event BinCountChanged(uint256 indexed binId, uint256 oldCount, uint256 newCount, address indexed participant);
```

### 1. Bin Configuration Events

**When:** Researcher calls `configureBins()` to set up study bins

**Events Emitted:**
1. `BinConfigurationStarted` - Logs when bin configuration starts
   - `caller`: Address calling the function
   - `binCount`: Number of bins being configured

2. `BinConfigured` (emitted for EACH bin) - Logs details of each bin
   - `index`: Position in bins array (0, 1, 2...)
   - `binId`: Unique bin identifier
   - `criteriaField`: Field name (e.g., "age", "bmi")
   - `label`: Human-readable label (e.g., "Ages 10-20")
   - `binType`: 0=RANGE, 1=CATEGORICAL

3. `BinsConfigured` - Final confirmation that all bins configured
   - `binCount`: Total bins configured

**Example Log Output:**
```
Event: BinConfigurationStarted
  caller: 0x1ea62ba66831b803c44a7979199ce0a0de0cdb24
  binCount: 3

Event: BinConfigured (index 0)
  binId: 0
  criteriaField: "age"
  label: "Ages 10-20"
  binType: 0 (RANGE)

Event: BinConfigured (index 1)
  binId: 1
  criteriaField: "age"
  label: "Ages 21-30"
  binType: 0 (RANGE)

Event: BinConfigured (index 2)
  binId: 2
  criteriaField: "gender"
  label: "Male"
  binType: 1 (CATEGORICAL)

Event: BinsConfigured
  binCount: 3
```

### 2. Bin Count Update Events

**When:** Patient calls `joinStudy()` which triggers `_updateBinCounts()`

**Events Emitted:**
1. `BinUpdateStarted` - Logs when bin update process starts
   - `participant`: Patient's wallet address
   - `binCount`: Number of bins to update
   - `increment`: true=joining, false=leaving

2. `BinCountChanged` (emitted for EACH bin) - Logs the change for each bin
   - `binId`: Which bin was updated
   - `oldCount`: Count before update
   - `newCount`: Count after update
   - `participant`: Who triggered the update

3. `BinCountUpdated` - Existing event, still emitted
   - `binId`: Which bin was updated
   - `newCount`: New count value

**Example Log Output:**
```
Event: BinUpdateStarted
  participant: 0x742d35Cc6634C0532925a3b8...
  binCount: 2
  increment: true

Event: BinCountChanged (bin 0)
  binId: 0
  oldCount: 5
  newCount: 6
  participant: 0x742d35Cc6634C0532925a3b8...

Event: BinCountChanged (bin 2)
  binId: 2
  oldCount: 12
  newCount: 13
  participant: 0x742d35Cc6634C0532925a3b8...
```

---

## 🔧 Backend Logging (studyService.ts)

### 1. Bin Configuration Backend Logs

**Location:** `apps/api/src/services/studyService.ts` - `configureBins()` function

**Logs Added:**

#### Before Configuration
```typescript
logger.info(
  {
    studyAddress,
    binCount: bins.length,
  },
  "[BIN CONFIG BACKEND] Starting bin configuration on study contract"
);

// For EACH bin being prepared:
logger.info(
  {
    index,
    binId: converted.binId,
    field: converted.criteriaField,
    type: converted.binType === 0 ? 'RANGE' : 'CATEGORICAL',
    label: converted.label,
    range: `[${converted.minValue}, ${converted.maxValue}]`,
  },
  `[BIN CONFIG BACKEND] Preparing bin ${index}`
);
```

#### After Configuration Success
```typescript
logger.info(
  {
    transactionHash: result.transactionHash,
    studyAddress,
    binCount: bins.length,
  },
  "[BIN CONFIG BACKEND] ✅ Bins configured successfully on blockchain"
);

// For EACH configured bin:
logger.info(
  {
    index,
    binId: bin.binId,
    field: bin.criteriaField,
    label: bin.label,
  },
  `[BIN CONFIG BACKEND] ✅ Bin ${index} now active on blockchain`
);
```

#### On Error
```typescript
logger.error(
  {
    error: result.error,
    studyAddress,
    binCount: bins.length,
  },
  "[BIN CONFIG BACKEND] ❌ Failed to configure bins"
);
```

**Example Console Output:**
```
[BIN CONFIG BACKEND] Starting bin configuration on study contract
  studyAddress: "0x1234..."
  binCount: 3

[BIN CONFIG BACKEND] Preparing bin 0
  index: 0
  binId: "0"
  field: "age"
  type: "RANGE"
  label: "Ages 10-20"
  range: "[10, 20]"

[BIN CONFIG BACKEND] ✅ Bins configured successfully on blockchain
  transactionHash: "0xabc123..."
  studyAddress: "0x1234..."
  binCount: 3

[BIN CONFIG BACKEND] ✅ Bin 0 now active on blockchain
  index: 0
  binId: "0"
  field: "age"
  label: "Ages 10-20"
```

### 2. Patient Join & Bin Update Backend Logs

**Location:** `apps/api/src/services/studyService.ts` - `recordParticipation()` function

**Logs Added:**

#### Before Joining
```typescript
logger.info(
  {
    participantWallet,
    studyAddress,
    binIdsReceived: binIds.length,
  },
  "[BIN UPDATE BACKEND] Processing participant join - preparing bin updates"
);

// Log which bins will be incremented:
logger.info(
  {
    totalBinSlots: binIdsFromPubSignals.length,
    binsToIncrement,
    binCount: binsToIncrement.length,
  },
  `[BIN UPDATE BACKEND] Participant belongs to ${binsToIncrement.length} bins - will increment these on blockchain`
);
```

#### After Successful Join
```typescript
logger.info(
  { 
    transactionHash: result.transactionHash, 
    participantWallet,
    studyAddress,
    binCount: binsIncremented.length,
    binsIncremented,
  },
  `[BIN UPDATE BACKEND] ✅ Participation recorded! ${binsIncremented.length} bin(s) incremented on blockchain`
);

// For EACH incremented bin:
logger.info(
  { binId, participant: participantWallet },
  `[BIN UPDATE BACKEND] ✅ Bin ${binId} count incremented for participant`
);
```

#### On Error
```typescript
logger.error(
  { error: result.error, studyAddress, participantWallet },
  "[BIN UPDATE BACKEND] ❌ Failed to record participation on blockchain"
);
```

**Example Console Output:**
```
[BIN UPDATE BACKEND] Processing participant join - preparing bin updates
  participantWallet: "0x742d35Cc..."
  studyAddress: "0x1234..."
  binIdsReceived: 5

[BIN UPDATE BACKEND] Participant belongs to 2 bins - will increment these on blockchain
  totalBinSlots: 50
  binsToIncrement: [0, 2]
  binCount: 2

[BIN UPDATE BACKEND] ✅ Participation recorded! 2 bin(s) incremented on blockchain
  transactionHash: "0xdef456..."
  participantWallet: "0x742d35Cc..."
  studyAddress: "0x1234..."
  binCount: 2
  binsIncremented: [0, 2]

[BIN UPDATE BACKEND] ✅ Bin 0 count incremented for participant
  binId: 0
  participant: "0x742d35Cc..."

[BIN UPDATE BACKEND] ✅ Bin 2 count incremented for participant
  binId: 2
  participant: "0x742d35Cc..."
```

---

## 🔍 How to Use This Logging

### For Bin Configuration (Study Creation)

1. **Start your API server** with logging enabled
2. **Create a study** through the frontend
3. **Watch the logs** for:
   - `[BIN CONFIG BACKEND]` messages showing bin preparation
   - Blockchain events: `BinConfigurationStarted`, `BinConfigured`, `BinsConfigured`
4. **Verify** that all bins appear with correct parameters

### For Bin Count Updates (Patient Joins)

1. **Have a study with configured bins**
2. **Patient applies to study** (e.g., age 15 for bin "10-20")
3. **Watch the logs** for:
   - `[BIN UPDATE BACKEND]` showing which bins match (e.g., `[0, 2]`)
   - Blockchain events: `BinUpdateStarted`, `BinCountChanged` for each bin
4. **Verify** that:
   - Correct bins are identified (age 15 → bin 0)
   - Counts increment correctly (5 → 6)
   - Transaction succeeds

### Viewing Blockchain Events

You can query events using viem/ethers:

```typescript
// Get bin configuration events
const configEvents = await studyContract.getEvents.BinConfigured();

// Get bin count update events  
const updateEvents = await studyContract.getEvents.BinCountChanged({
  participant: "0x742d35Cc..."
});

// Get all updates for a specific bin
const binUpdates = await studyContract.getEvents.BinCountChanged({
  binId: 0n
});
```

---

## 📝 Log Prefixes Reference

| Prefix | Location | Purpose |
|--------|----------|---------|
| `[BIN CONFIG BACKEND]` | Backend API | Bin configuration operations |
| `[BIN UPDATE BACKEND]` | Backend API | Bin count update operations |
| `BinConfigurationStarted` | Smart Contract Event | Bin config started |
| `BinConfigured` | Smart Contract Event | Individual bin configured |
| `BinsConfigured` | Smart Contract Event | All bins configured |
| `BinUpdateStarted` | Smart Contract Event | Bin update started |
| `BinCountChanged` | Smart Contract Event | Bin count changed |
| `BinCountUpdated` | Smart Contract Event | Bin count updated (legacy) |

---

## ✅ Success Indicators

When everything works correctly, you should see:

### Study Creation Flow
1. ✅ Backend logs each bin being prepared
2. ✅ Transaction succeeds
3. ✅ `BinConfigured` events emitted for each bin
4. ✅ Backend confirms each bin is active

### Patient Join Flow  
1. ✅ Backend identifies correct bins (e.g., [0, 2])
2. ✅ Transaction succeeds
3. ✅ `BinCountChanged` events show old → new counts
4. ✅ Backend confirms each bin incremented

---

## 🚀 Next Steps

After adding this logging:

1. **Redeploy the smart contract** to get new events
2. **Restart the API server** to use new backend logs
3. **Test study creation** - verify bins configured correctly
4. **Test patient joining** - verify bins incremented correctly
5. **Check transaction receipts** for emitted events
6. **Review API logs** for detailed operation tracking

The logging is now comprehensive enough to trace the complete bin lifecycle from configuration through updates!

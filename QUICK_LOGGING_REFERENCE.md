# Quick Logging Reference - Bin Counting System

## 🎯 What Was Added

Comprehensive logging to verify bin operations at two critical points:

### 1️⃣ Study Creation (Bin Configuration)
**Files Modified:**
- `packages/smart-contracts/contracts/studies/Study.sol`
- `apps/api/src/services/studyService.ts`

**What You'll See:**
```
[BIN CONFIG BACKEND] Starting bin configuration...
[BIN CONFIG BACKEND] Preparing bin 0
  → binId: 0, field: "age", label: "Ages 10-20"
[BIN CONFIG BACKEND] ✅ Bins configured successfully
```

**Smart Contract Events:**
- `BinConfigurationStarted(caller, binCount)`
- `BinConfigured(index, binId, field, label, type)` - for each bin
- `BinsConfigured(binCount)` - final confirmation

### 2️⃣ Patient Joins Study (Bin Count Updates)
**Files Modified:**
- `packages/smart-contracts/contracts/studies/Study.sol`
- `apps/api/src/services/studyService.ts`

**What You'll See:**
```
[BIN UPDATE BACKEND] Processing participant join...
[BIN UPDATE BACKEND] Participant belongs to 2 bins: [0, 2]
[BIN UPDATE BACKEND] ✅ Bin 0 incremented: 5 → 6
[BIN UPDATE BACKEND] ✅ Bin 2 incremented: 12 → 13
```

**Smart Contract Events:**
- `BinUpdateStarted(participant, binCount, increment)`
- `BinCountChanged(binId, oldCount, newCount, participant)` - for each bin
- `BinCountUpdated(binId, newCount)` - legacy event still emitted

---

## 🔧 How to Verify It Works

### Step 1: Redeploy Smart Contract
The contract has new events, so you need to redeploy:

```powershell
cd packages\smart-contracts
bun run deploy:sepolia
```

### Step 2: Update Contract ABIs
After deployment, regenerate ABIs:

```powershell
cd apps\api
bun run generate-abis
```

### Step 3: Restart API Server
```powershell
cd apps\api
bun run dev
```

### Step 4: Test Study Creation
1. Create a new study with bins
2. Watch API logs for `[BIN CONFIG BACKEND]` messages
3. Check blockchain explorer for `BinConfigured` events

### Step 5: Test Patient Join
1. Have a patient join the study (e.g., age 15)
2. Watch API logs for `[BIN UPDATE BACKEND]` messages
3. Verify correct bins are incremented (e.g., bin 0 for "Ages 10-20")

---

## 📊 Example Verification Scenario

**Setup:** Study with bins:
- Bin 0: Ages 10-20
- Bin 1: Ages 21-30
- Bin 2: Male gender

**Patient:** Age 15, Male

**Expected Logs:**

```
[BIN UPDATE BACKEND] Participant belongs to 2 bins - will increment these on blockchain
  binsToIncrement: [0, 2]

[BIN UPDATE BACKEND] ✅ Participation recorded! 2 bin(s) incremented on blockchain
  binsIncremented: [0, 2]

[BIN UPDATE BACKEND] ✅ Bin 0 count incremented for participant
[BIN UPDATE BACKEND] ✅ Bin 2 count incremented for participant
```

**Expected Events:**
```
BinUpdateStarted: participant=0x..., binCount=2, increment=true
BinCountChanged: binId=0, oldCount=5, newCount=6
BinCountChanged: binId=2, oldCount=8, newCount=9
```

---

## 🐛 Troubleshooting

### No logs appearing?
- Check API server is running with `bun run dev`
- Ensure logger level allows INFO messages
- Check console for `[BIN CONFIG BACKEND]` or `[BIN UPDATE BACKEND]`

### Events not showing in blockchain explorer?
- Verify contract was redeployed after adding events
- Check transaction receipt for event logs
- Use correct contract address

### Wrong bins incremented?
- Check `binsToIncrement` array in logs
- Verify bin membership calculation in frontend
- Check ZK proof public signals extraction

---

## 📁 Files Changed

1. **packages/smart-contracts/contracts/studies/Study.sol**
   - Added 4 new events for detailed logging
   - Modified `configureBins()` to emit configuration events
   - Modified `_updateBinCounts()` to emit update events

2. **apps/api/src/services/studyService.ts**
   - Enhanced `configureBins()` with detailed logging
   - Enhanced `recordParticipation()` with bin update tracking
   - Added bin membership extraction and logging

3. **BIN_COUNTING_VERIFICATION.md** (created)
   - Complete verification guide

4. **LOGGING_ADDED.md** (created)
   - Comprehensive logging documentation

---

## ✅ Success Checklist

- [ ] Smart contract redeployed with new events
- [ ] ABIs regenerated
- [ ] API server restarted
- [ ] Study created - logs show bin configuration
- [ ] Patient joined - logs show correct bins incremented
- [ ] Blockchain events visible in explorer
- [ ] Bin counts match expectations

---

**Need Help?** Check `LOGGING_ADDED.md` for detailed examples of all log output!

# 🚨 QUICK FIX: 404 Circuit File Error

## Problem
```
GET http://localhost:3000/circuits/data_aggregation.wasm 404 (Not Found)
```

## Root Cause
The `data_aggregation.circom` circuit has **NOT been compiled yet**. Only the source code exists.

## ✅ Solution (5 minutes)

```bash
# Navigate to circuits directory
cd packages/smart-contracts/circuits

# If Powers of Tau already exists (from medical_eligibility):
bun run compile:aggregation
bun run setup-circuit:aggregation
bun run copy-to-web

# If Powers of Tau doesn't exist (first time):
bun run setup-all
bun run copy-to-web
```

## What This Does

1. **Compiles the circuit** → Creates `.wasm` and `.r1cs` files
2. **Generates proving key** → Creates `.zkey` file
3. **Copies to web** → Places files in `apps/web/public/circuits/`

## Expected Output

After running the commands, you should have:

```
apps/web/public/circuits/
├── data_aggregation.wasm              ← Browser uses this
├── data_aggregation_0001.zkey         ← Browser uses this
└── data_aggregation_verification_key.json
```

## Verification

Check files exist:
```bash
ls -la apps/web/public/circuits/
```

You should see:
- ✅ `data_aggregation.wasm` (~500KB)
- ✅ `data_aggregation_0001.zkey` (~50MB)

## After Setup

1. **Restart Next.js dev server** (if running)
2. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Try applying to a study again**

The 404 error should be gone, and you should see detailed ZK proof generation logs in the browser console.

## Detailed Guide

For more information, see:
- `packages/smart-contracts/circuits/DATA_AGGREGATION_SETUP.md`

## Time Estimate

- With existing Powers of Tau: **~3-5 minutes**
- Without (first time setup): **~10-15 minutes**

---

## What's Happening Behind the Scenes

The data aggregation circuit:
- Takes **14 private inputs** (age, gender, cholesterol, BMI, etc.)
- Outputs **14 public binned values** (age bucket, gender category, etc.)
- Proves data is valid **without revealing exact values**
- Prevents participants from **faking their data**

This is more complex than the eligibility circuit, so compilation takes longer.

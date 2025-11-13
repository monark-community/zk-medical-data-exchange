# ZK Circuit Deployment Guide

This guide explains the **complete workflow** for deploying ZK circuit changes to the blockchain and frontend.

## 📋 When Do You Need This?

Follow these steps whenever you:
- Modify the `medical_eligibility.circom` circuit
- Recompile the circuit for any reason
- Need to deploy a new verifier contract

## ⚠️ Important Notes

- **Old studies cannot work with new verifiers** - blockchain contracts are immutable
- **You must create a NEW study** after deploying a new verifier
- **All steps must be completed in order** for the system to work

---

## 🔧 Step-by-Step Deployment Process

### Step 1: Compile the Circuit

```bash
cd packages/smart-contracts/circuits
bun run compile
```

**What this does:**
- Compiles `medical_eligibility.circom` into constraint files
- Generates `build/medical_eligibility_js/medical_eligibility.wasm` (for proof generation)
- Generates `build/medical_eligibility_0001.zkey` (proving key)
- Generates `build/medical_eligibility.r1cs` (constraint system)

**Output files:**
```
circuits/build/
├── medical_eligibility_js/
│   ├── medical_eligibility.wasm    ← Used by frontend
│   ├── generate_witness.js
│   └── witness_calculator.js
├── medical_eligibility_0001.zkey    ← Used by frontend
├── medical_eligibility.r1cs
└── medical_eligibility.sym
```

---

### Step 2: Generate the Verifier Contract

```bash
bun run generate-verifier
```

**What this does:**
- Reads `build/medical_eligibility_0001.zkey`
- Generates Solidity verifier contract
- Outputs to `contracts/studies/MedicalEligibilityVerifier.sol`

**Output:**
- `contracts/studies/MedicalEligibilityVerifier.sol` - Groth16 verifier matching the circuit

---

### Step 3: Deploy the Verifier Contract

```bash
cd packages/smart-contracts
bun run deploy:verifier
```

**What this does:**
- Deploys `Groth16Verifier` contract to Sepolia testnet
- Returns the deployed contract address

**Example output:**
```
🎉 VERIFIER DEPLOYMENT COMPLETED SUCCESSFULLY!
📋 Contract Address:
   MedicalEligibilityVerifier: 0x939b51d7641e718f1c7321a12c05d407f7283a99
🔗 Verification Link:
   https://sepolia.etherscan.io/address/0x939b51d7641e718f1c7321a12c05d407f7283a99
```

**⚠️ Copy this address!** You'll need it in the next step.

---

### Step 4: Update API Environment Variables

Open `apps/api/.env` and update:

```env
ZK_VERIFIER_ADDRESS=0x939b51d7641e718f1c7321a12c05d407f7283a99
```

Replace with the **actual address from Step 3**.

---

### Step 5: Copy Circuit Files to Frontend ⚠️ **CRITICAL STEP**

**From workspace root**, run:

```powershell
# Copy WASM file
Copy-Item -Path "packages\smart-contracts\circuits\build\medical_eligibility_js\medical_eligibility.wasm" -Destination "apps\web\public\circuits\medical_eligibility.wasm" -Force
# Copy zkey file
Copy-Item -Path "packages\smart-contracts\circuits\build\medical_eligibility_0001.zkey" -Destination "apps\web\public\circuits\medical_eligibility_0001.zkey" -Force
```

**Why this is needed:**
- The frontend loads circuit files from `apps/web/public/circuits/`
- These files MUST match the deployed verifier contract
- Old files will cause "ZK proof verification failed" errors

**Verify the copy worked:**
```powershell
ls apps\web\public\circuits\ | Select-Object Name,LastWriteTime
```

You should see today's date on both files.

---

### Step 6: Restart the API Server

```bash
# Stop the API (Ctrl+C in the terminal running it)

# Start it again
cd apps/api
bun run dev:api
```

**Why:** The API needs to reload the new `ZK_VERIFIER_ADDRESS` from `.env`.

---

### Step 7: Hard Refresh the Frontend

In your browser:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

**Why:** This clears the browser cache and forces it to download the new `.wasm` and `.zkey` files.

---

### Step 8: Create a NEW Study

1. Go to your frontend dashboard
2. Click "Create Study"
3. Fill in the study details
4. **Deploy to blockchain**
5. Wait for deployment confirmation

**⚠️ Critical:** 
- The new study will automatically use the new verifier address
- Old studies are **permanently tied to old verifiers** and cannot be updated
- You must create a fresh study after each verifier deployment

---

### Step 9: Test by Applying to the NEW Study

1. Click "Apply" on the **newly created study**
2. Wait for ZK proof generation (10-30 seconds)
3. Submit the application

**Expected result:**
- ✅ Proof generation succeeds
- ✅ Database participation recorded
- ✅ Blockchain transaction succeeds
- ✅ Transaction hash returned

**If it fails:**
- Check that you completed ALL steps above
- Verify `.env` has correct verifier address
- Verify frontend files were copied (Step 5)
- Verify you're applying to a NEW study, not an old one

---

## 🐛 Troubleshooting

### Error: "ZK proof verification failed - not eligible"

**Causes:**
1. ❌ Applying to an OLD study (created before latest verifier deployment)
2. ❌ Frontend using old `.wasm` or `.zkey` files (forgot Step 5)
3. ❌ API using old verifier address (forgot Step 4 or Step 6)
4. ❌ Browser cache not cleared (forgot Step 7)

**Solution:**
- Double-check you completed Steps 4-8 in order
- Create a BRAND NEW study
- Apply only to the new study

---

### Error: "Failed to load circuit files"

**Causes:**
1. ❌ Circuit files not copied to frontend (Step 5)
2. ❌ Files in wrong location

**Solution:**
```powershell
# Check if files exist
ls apps\web\public\circuits\
# Should show:
# medical_eligibility.wasm
# medical_eligibility_0001.zkey
```

If missing, repeat Step 5.

---

### Error: "Verifier contract not found"

**Causes:**
1. ❌ Wrong verifier address in `.env`
2. ❌ API not restarted after updating `.env`

**Solution:**
1. Verify `ZK_VERIFIER_ADDRESS` in `apps/api/.env`
2. Check it exists on Sepolia: https://sepolia.etherscan.io/address/YOUR_ADDRESS
3. Restart API (Step 6)

---

## 📝 Quick Reference Checklist

When deploying a new verifier, check off each step:

- [ ] 1. Compile circuit (`bun run compile`)
- [ ] 2. Generate verifier (`bun run generate-verifier`)
- [ ] 3. Deploy verifier (`bun run deploy:verifier`)
- [ ] 4. Copy verifier address
- [ ] 5. Update `apps/api/.env` with new address
- [ ] 6. Copy `.wasm` file to frontend
- [ ] 7. Copy `.zkey` file to frontend
- [ ] 8. Restart API server
- [ ] 9. Hard refresh browser (Ctrl+Shift+R)
- [ ] 10. Create NEW study from frontend
- [ ] 11. Test by applying to NEW study only

---

## 🔗 Related Files

- **Circuit source:** `packages/smart-contracts/circuits/medical_eligibility.circom`
- **Verifier contract:** `packages/smart-contracts/contracts/studies/MedicalEligibilityVerifier.sol`
- **Study contract:** `packages/smart-contracts/contracts/studies/Study.sol`
- **Frontend proof generator:** `apps/web/services/zk/zkProofGenerator.ts`
- **API configuration:** `apps/api/.env`

---

## ⚡ Future Improvement: Automation Script

Consider creating a script to automate Steps 5-7:

```json
// Add to package.json
{
  "scripts": {
    "update-circuits": "node scripts/updateCircuits.js"
  }
}
```

This script would:
1. Copy `.wasm` and `.zkey` to frontend
2. Remind you to update `.env`
3. Remind you to restart API
4. Remind you to create new study

---

## 📚 Additional Resources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)
- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)

---

**Last Updated:** November 6, 2025
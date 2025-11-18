# Phase 3: Circuit Deployment Guide (Single Unified Circuit)

This guide walks through redeploying the `medical_eligibility.circom` circuit which now includes **optional** bin membership computation.

## 🎯 Overview

The circuit has been extended to support bin membership while remaining backward compatible:
- **Input:** Medical data + bin configurations (private) - bins are optional
- **Output:** Eligibility (1/0) + binMembership array (which bins the participant belongs to)
- **For studies WITHOUT bins:** Pass `numBins = 0`, all bin outputs will be zeros
- **For studies WITH bins:** Pass `numBins > 0`, bin outputs show membership

## 📋 Prerequisites

- Circom 2.0+ installed
- snarkjs installed
- All previous deployments completed successfully

---

## 🔧 Step-by-Step Deployment

### Step 1: Compile the Circuit

```bash
cd packages/smart-contracts/circuits
circom medical_eligibility.circom --r1cs --wasm --sym -o build/ -l node_modules
```

**What this does:**
- Compiles the updated circuit with bin membership logic
- Outputs to `build/` directory (same as before)
- Generates WASM, R1CS, and symbol files

**Expected output:**
```
build/
├── medical_eligibility_js/
│   ├── medical_eligibility.wasm
│   ├── generate_witness.js
│   └── witness_calculator.js
├── medical_eligibility.r1cs
└── medical_eligibility.sym
```

---

### Step 2: Trusted Setup (Ceremony)

Since we've **updated the existing circuit**, you need to perform a new trusted setup ceremony:

```bash
# Step 2.1: Generate powers of tau (phase 1)
snarkjs powersoftau new bn128 14 build/pot14_0000.ptau -v

# Step 2.2: Contribute to phase 1
snarkjs powersoftau contribute build/pot14_0000.ptau build/pot14_0001.ptau --name="First contribution" -v

# Step 2.3: Prepare phase 2
snarkjs powersoftau prepare phase2 build/pot14_0001.ptau build/pot14_final.ptau -v

# Step 2.4: Generate zkey (phase 2 - circuit specific)
snarkjs groth16 setup build/medical_eligibility.r1cs build/pot14_final.ptau build/medical_eligibility_0000.zkey

# Step 2.5: Contribute to phase 2
snarkjs zkey contribute build/medical_eligibility_0000.zkey build/medical_eligibility_0001.zkey --name="First contribution" -v

# Step 2.6: Export verification key
snarkjs zkey export verificationkey build/medical_eligibility_0001.zkey build/verification_key.json
```

**Why larger tau (14 vs 12)?**
The circuit is larger now due to bin membership checks (up to 50 bins × multiple checks per bin). Phase 1 power of tau must support the circuit's increased constraint count.

---

### Step 3: Generate the Verifier Contract

```bash
snarkjs zkey export solidityverifier build/medical_eligibility_0001.zkey ../contracts/studies/MedicalEligibilityVerifier.sol
```

**Output:** `MedicalEligibilityVerifier.sol` - Groth16 verifier for the updated circuit

**Note:** This **overwrites** the existing verifier contract, which is correct since we're replacing the circuit.

---

### Step 4: Deploy the Verifier Contract

You can use the existing deployment script for the verifier. Deploy to Sepolia:

```bash
cd packages/smart-contracts
bun run deploy:verifier
```

**If you need to create the deployment script**, it should look like this (`scripts/deployVerifier.ts`):

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying MedicalEligibilityVerifier...\n");

  const VerifierFactory = await ethers.getContractFactory("MedicalEligibilityVerifier");
  const verifier = await VerifierFactory.deploy();
  await verifier.waitForDeployment();

  const verifierAddress = await verifier.getAddress();

  console.log("✅ MedicalEligibilityVerifier deployed to:", verifierAddress);
  console.log("\n📝 Update apps/api/.env with:");
  console.log(`ZK_VERIFIER_ADDRESS=${verifierAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Copy the verifier address** from the output.

---

### Step 5: Update Environment Variables

Update `apps/api/.env`:

```env
# Updated verifier that supports bins (and backward compatible with non-bin studies)
ZK_VERIFIER_ADDRESS=0x...new_address_from_step4...
```

**Important:** All new studies (with or without bins) will use this verifier. The circuit handles both cases automatically.

---

### Step 6: Copy Circuit Files to Frontend

**From workspace root**, run:

```powershell
# Copy WASM file (overwrite existing)
Copy-Item -Path "packages\smart-contracts\circuits\build\medical_eligibility_js\medical_eligibility.wasm" -Destination "apps\web\public\circuits\medical_eligibility.wasm" -Force

# Copy zkey file (overwrite existing)
Copy-Item -Path "packages\smart-contracts\circuits\build\medical_eligibility_0001.zkey" -Destination "apps\web\public\circuits\medical_eligibility_0001.zkey" -Force
```

**Verify:**
```powershell
ls apps\web\public\circuits\ | Select-Object Name,LastWriteTime
```

You should see today's date on both files.

---

### Step 7: Restart the API Server

```bash
# Stop the API (Ctrl+C in the terminal running it)

# Start it again
cd apps/api
bun run dev:api
```

**Why:** The API needs to reload the new `ZK_VERIFIER_ADDRESS` from `.env`.

---

### Step 8: Hard Refresh the Frontend

In your browser:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

**Why:** This clears the browser cache and forces it to download the new `.wasm` and `.zkey` files.

---

### Step 9: Test with a Study

**Create a study (with or without bins):**

1. Go to your frontend dashboard
2. Click "Create Study"
3. Fill in the study details
4. Optionally configure bins (or skip bin configuration)
5. Deploy to blockchain

**The proof generation will work for both cases:**
- **Study WITHOUT bins:** Proof will be generated with `numBins = 0`, bin outputs ignored
- **Study WITH bins:** Proof will include bin membership in public signals

---

## 🧪 Testing the New Circuit

### Test 1: Compile Success

```bash
cd packages/smart-contracts/circuits
circom medical_eligibility_with_bins.circom --r1cs --wasm --sym -o build_bins/ -l node_modules
```

Should complete without errors and output constraint count.

### Test 2: Circuit Info

```bash
snarkjs r1cs info build_bins/medical_eligibility_with_bins.r1cs
```

Should show:
- Number of constraints (should be < 2^14 for our setup)
- Number of private inputs
- Number of public inputs/outputs

### Test 3: Generate Test Proof

Create a test input file `test_bin_input.json`:

```json
{
  "age": "45",
  "gender": "1",
  "bmi": "254",
  "cholesterol": "200",
  "numBins": "5",
  "binFieldCodes": ["0", "1", "4", "3", "9", ...],
  "binTypes": ["0", "1", "0", "0", "1", ...],
  "binMinValues": ["40", "0", "200", "150", "0", ...],
  "binMaxValues": ["50", "0", "300", "250", "0", ...],
  ...
}
```

Generate proof:

```bash
node build_bins/medical_eligibility_with_bins_js/generate_witness.js \
  build_bins/medical_eligibility_with_bins_js/medical_eligibility_with_bins.wasm \
  test_bin_input.json \
  build_bins/witness.wtns

snarkjs groth16 prove \
  build_bins/medical_eligibility_with_bins_0001.zkey \
  build_bins/witness.wtns \
  build_bins/proof.json \
  build_bins/public.json
```

Should complete successfully. Check `build_bins/public.json` for outputs.

### Test 4: Verify Proof

```bash
snarkjs groth16 verify \
  build_bins/verification_key.json \
  build_bins/public.json \
  build_bins/proof.json
```

Should output: `[INFO]  snarkJS: OK!`

---

## 📊 Circuit Complexity

The new circuit is significantly larger than the original:

| Metric | Original | With Bins (50 bins) |
|--------|----------|---------------------|
| Constraints | ~5,000 | ~50,000 (estimate) |
| Private Inputs | ~60 | ~750 |
| Public Outputs | 1 (eligible) | 51 (eligible + 50 bin flags) |
| Proof Gen Time | 5-10s | 20-40s (estimate) |

**Note:** Actual numbers depend on final circuit optimization.

---

## 🐛 Troubleshooting

### Error: "not enough constraints"

**Solution:** Increase power of tau to 15:
```bash
snarkjs powersoftau new bn128 15 build_bins/pot15_0000.ptau -v
```

### Error: "Out of memory during proof generation"

**Cause:** Circuit too large for browser/node memory

**Solutions:**
1. Reduce MAX_BINS constant in circuit (e.g., 30 instead of 50)
2. Generate proofs server-side instead of client-side
3. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=8192`

### Error: "Invalid proof" during verification

**Common causes:**
1. Mismatch between circuit files (.wasm, .zkey) and verifier contract
2. Incorrect input format (array sizes don't match MAX_BINS)
3. Using old verifier address with new circuit

**Debug steps:**
1. Verify all files are from the same compilation
2. Check input JSON matches circuit expectations
3. Test proof generation locally first
4. Verify verifier address in `.env` is correct

---

## 📝 Next Steps

After successful circuit deployment:

1. ✅ Circuit compiled and setup complete
2. ✅ Verifier contract deployed
3. ✅ Files copied to frontend
4. ⏭️ Update proof generation service → `PHASE_3_PROOF_GENERATION.md`
5. ⏭️ Update contract interaction logic → `PHASE_3_CONTRACT_INTEGRATION.md`
6. ⏭️ End-to-end testing with real study

---

## 🔒 Security Notes

- **Trusted Setup:** The ceremony ensures no single party can forge proofs
- **Powers of Tau:** Phase 1 is universal and can be reused
- **Circuit-Specific zkey:** Phase 2 must be redone for each circuit change
- **Verifier Immutability:** Once deployed, verifier cannot be changed
- **Study-Verifier Binding:** Each study is permanently tied to its verifier address

---

## 📚 Additional Resources

- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Circom Documentation](https://docs.circom.io/)
- [Groth16 Trusted Setup](https://github.com/iden3/snarkjs#7-prepare-phase-2)
- [ZK Proof Optimization Guide](https://docs.circom.io/circom-language/circom-insight/simplification/)

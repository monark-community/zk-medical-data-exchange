# Data Aggregation Circuit Setup Guide

## ⚠️ Current Status

The `data_aggregation.circom` circuit has been created but **NOT yet compiled**. You need to complete the following steps to make it work.

## 🚀 Quick Setup (Recommended)

If the Powers of Tau ceremony was already done for `medical_eligibility`, you can reuse it:

```bash
cd packages/smart-contracts/circuits

# Step 1: Compile the data aggregation circuit
bun run compile:aggregation

# Step 2: Setup the circuit using existing Powers of Tau
bun run setup-circuit:aggregation

# Step 3: Copy files to web public directory
bun run copy-to-web
```

**That's it!** The circuit files will be available at:
- `apps/web/public/circuits/data_aggregation.wasm`
- `apps/web/public/circuits/data_aggregation_0001.zkey`

## 🔧 Full Setup (If Powers of Tau doesn't exist)

If you haven't compiled any circuits yet, run the full setup:

```bash
cd packages/smart-contracts/circuits

# This will:
# 1. Compile both circuits
# 2. Run trusted setup (Powers of Tau)
# 3. Generate proving keys for both circuits
# 4. Generate Solidity verifiers
bun run setup-all

# Then copy data aggregation files to web
bun run copy-to-web
```

## 📁 What Gets Generated

After running the setup, you'll have:

```
circuits/build/
├── data_aggregation_js/
│   ├── data_aggregation.wasm          ← Frontend uses this
│   ├── generate_witness.js
│   └── witness_calculator.js
├── data_aggregation_0001.zkey          ← Frontend uses this
├── data_aggregation_verification_key.json  ← Backend uses this
├── data_aggregation.r1cs
└── data_aggregation.sym
```

And copied to frontend:
```
apps/web/public/circuits/
├── data_aggregation.wasm
├── data_aggregation_0001.zkey
└── data_aggregation_verification_key.json
```

## ⏱️ Estimated Time

- **Quick Setup**: ~2-5 minutes (reusing Powers of Tau)
- **Full Setup**: ~10-15 minutes (includes Powers of Tau ceremony)

The circuit has **14 inputs** and generates **multiple binned outputs**, so compilation may take a bit longer than the eligibility circuit.

## ✅ Verification

After setup, verify the files exist:

```bash
# Check build directory
ls -la packages/smart-contracts/circuits/build/data_aggregation_js/

# Check web public directory
ls -la apps/web/public/circuits/
```

You should see:
- ✅ `data_aggregation.wasm`
- ✅ `data_aggregation_0001.zkey`

## 🔄 After Setup

Once the files are in place:

1. **Restart your dev servers** to pick up the new files
2. **Test the apply flow** - the 404 error should be gone
3. **Check browser console** - you should see successful ZK proof generation logs

## 🐛 Troubleshooting

### Error: "circom: command not found"
Install circom globally:
```bash
npm install -g circom
```

### Error: "snarkjs: command not found"
It's already in dependencies, but if needed:
```bash
npm install -g snarkjs
```

### Files not found after compilation
Make sure to run `bun run copy-to-web` to copy files from `build/` to `public/circuits/`

### Still getting 404 errors
1. Check that files exist in `apps/web/public/circuits/`
2. Restart the Next.js dev server: `bun run dev` in `apps/web`
3. Clear browser cache and reload

## 📝 Notes

- **Powers of Tau can be reused** across circuits of similar size
- **The `.ptau` files are large** (~100MB) but only needed during setup, not runtime
- **Circuit changes require recompilation** - run `bun run compile:aggregation` again
- **Frontend caches circuit files** - hard refresh browser after updates

## 🎯 Next Steps

After compilation:
1. Test ZK proof generation in browser
2. Verify proofs are submitted to backend
3. Test aggregation endpoint
4. Check that logs show detailed proof generation steps

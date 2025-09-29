# Testing the MedicalEligibilityVerifier Contract

This guide shows you how to test the `Groth16Verifier` contract (MedicalEligibilityVerifier) in several ways.

## Quick Test (Recommended)

Run the simple test script that uses pre-generated proof data:

```bash
cd packages/smart-contracts
npm run test:verifier
# or directly:
node test/test-verifier.js
```

This will:

- ✅ Deploy the verifier contract
- ✅ Test valid proof verification
- ✅ Test invalid proof rejection
- ✅ Test edge cases (zero proofs)
- ✅ Measure gas consumption
- ✅ Test multiple verification calls

## Integration Test (Advanced)

Run the full integration test that generates fresh proofs:

```bash
cd packages/smart-contracts
npm run test:integration
# or directly:
node test/integration-test.js
```

This will:

- 🔄 Generate a fresh ZK proof from the circuit
- 🚀 Deploy the verifier contract
- 🔍 Verify the fresh proof on-chain
- ⛽ Measure gas consumption
- 📊 Provide performance metrics

## Manual Testing Steps

### 1. Generate Test Proofs

First, generate some test proofs using the circuit:

```bash
cd packages/smart-contracts/circuits
node test_proof.js
```

This will output proof data in Solidity format that you can copy.

### 2. Deploy and Test

Use Hardhat console or create your own test script:

```bash
cd packages/smart-contracts
bunx hardhat console
```

Then in the console:

```javascript
// Deploy the contract
const verifier = await viem.deployContract("Groth16Verifier");

// Test with proof data (replace with your generated proof)
const result = await verifier.read.verifyProof([
  [
    /* a values */
  ],
  [
    [
      /* b values */
    ],
  ],
  [
    /* c values */
  ],
  [
    /* public signals */
  ],
]);

console.log("Verification result:", result);
```

## What Each Test Validates

### ✅ Valid Proof Verification

- Tests that correctly generated proofs are accepted
- Ensures the verification key matches the circuit

### ❌ Invalid Proof Rejection

- Tests that tampered proofs are rejected
- Verifies cryptographic security

### 🔢 Edge Case Handling

- Tests zero proofs (should be rejected)
- Tests malformed inputs

### ⛽ Gas Efficiency

- Measures gas consumption (~210k gas)
- Ensures reasonable transaction costs

### 🔄 Multiple Calls

- Tests contract state consistency
- Verifies no side effects between calls

## Expected Results

- **Valid proofs**: Should return `true`
- **Invalid proofs**: Should return `false`
- **Gas consumption**: ~210,000 gas (efficient for Groth16)
- **Performance**: Fast verification (<1 second)

## Troubleshooting

### Circuit Files Missing

If you get errors about missing circuit files:

```bash
cd packages/smart-contracts/circuits
npm install
npm run compile
```

### Hardhat Issues

If Hardhat tests fail, use the standalone scripts:

```bash
node test-verifier.js  # Always works
```

### Fresh Proof Generation

If you need fresh proofs with different parameters, modify the patient data in `circuits/test_proof.js`.

## Security Notes

🔒 **Privacy**: Only eligibility results (0 or 1) are revealed  
🛡️ **Integrity**: Invalid proofs cannot pass verification  
⚡ **Efficiency**: Groth16 provides constant-size proofs and fast verification  
🔐 **Zero-Knowledge**: Patient data remains completely private

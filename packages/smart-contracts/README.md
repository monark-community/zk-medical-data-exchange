# ZK Medical Data Exchange - Smart Contracts

Privacy-preserving medical study enrollment using Zero-Knowledge proofs and blockchain technology.

## 🏥 Overview

This package contains the smart contracts and ZK circuits for the ZK Medical Data Exchange platform:

- **StudyFactory** - Creates and manages medical studies
- **Study** - Individual study contracts with ZK eligibility verification
- **MedicalEligibilityVerifier** - Groth16 ZK verifier for patient eligibility
- **Circom Circuit** - Zero-knowledge circuit for medical data privacy

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **bun**
- **Circom 2.0+** for circuit compilation
- **snarkjs** for proof generation
- **Sepolia testnet ETH** for deployment

### Installation

```bash
cd packages/smart-contracts
bun install
```

### Testing

```bash
# Test smart contracts
bun run test

# Test ZK proof generation and verification
cd circuits
node test_proof.js
```

## 📋 Core Components

### 1. Smart Contracts (`contracts/`)

- **StudyFactory.sol** - Deploys and manages study contracts
- **Study.sol** - Individual study with ZK eligibility verification
- **MedicalEligibilityVerifier.sol** - Generated Groth16 verifier

### 2. ZK Circuit (`circuits/`)

- **medical_eligibility.circom** - Patient eligibility verification circuit
- **test_proof.js** - Complete ZK proof testing suite
- **build/** - Compiled circuit artifacts (R1CS, WASM, proving/verification keys)

### 3. Deployment Scripts (`scripts/`)

- **deployStudyWithZK.ts** - Deploy complete ZK study infrastructure

## 🔧 Available Commands

```bash
# Smart contract testing
bun run test                    # All tests
bun run test:solidity          # Solidity unit tests only
bun run test:nodejs            # TypeScript integration tests
bun run test:zk-proof          # Complete ZK proof workflow test

# Deployment
bun run deploy:local           # Deploy to local hardhat network
bun run deploy:sepolia         # Deploy to Sepolia testnet
```

## 📚 Documentation

- **[SEPOLIA_DEPLOYMENT.md](./SEPOLIA_DEPLOYMENT.md)** - Deploy to Sepolia testnet
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - ZK verifier testing guide
- **[docs/CUSTOM_STUDIES.md](./docs/CUSTOM_STUDIES.md)** - Create custom medical studies

## 🎯 ZK Proof Workflow

1. **Patient Data Input** - Age, BMI, blood pressure, medical history, etc.
2. **Circuit Execution** - Generate ZK proof of eligibility without revealing data
3. **On-Chain Verification** - Smart contract verifies proof using Groth16 verifier
4. **Study Enrollment** - Eligible patients join study while preserving privacy

## 🔐 Privacy Features

- **Zero-Knowledge Proofs** - Prove eligibility without revealing medical data
- **Commitment Schemes** - Bind proofs to specific patient data
- **Range Proofs** - Verify values within study criteria ranges
- **Selective Disclosure** - Enable/disable specific eligibility criteria

## 🌐 Deployed Contracts (Sepolia)

See [SEPOLIA_DEPLOYMENT.md](./SEPOLIA_DEPLOYMENT.md) for current deployment addresses and interaction examples.

## 🧪 Example Study Criteria

```javascript
const studyCriteria = {
  enableAge: 1, // Enable age checking
  minAge: 18, // Minimum 18 years old
  maxAge: 65, // Maximum 65 years old
  enableBMI: 1, // Enable BMI checking
  minBMI: 185, // Minimum BMI 18.5 (stored as integer)
  maxBMI: 350, // Maximum BMI 35.0
  // All other criteria disabled by default
};
```

## 🛠️ Development

This package uses:

- **Hardhat 3** for smart contract development
- **Circom 2.0** for ZK circuit compilation
- **snarkjs** for proof generation and verification
- **viem** for blockchain interactions
- **TypeScript** for type safety

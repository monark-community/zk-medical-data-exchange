# CURA

A privacy-preserving Web3 platform that enables secure medical research through Zero-Knowledge proofs, allowing patients to participate in studies without revealing sensitive medical data.

---

## Overview

This platform combines blockchain technology with Zero-Knowledge cryptography to solve the privacy dilemma in medical research:

- **Patient Privacy** - Medical data never leaves the patient's control
- **Research Enablement** - Researchers can verify eligibility without accessing raw data
- **Zero-Knowledge Proofs** - Cryptographic proofs of eligibility without data disclosure
- **Blockchain Verification** - Decentralized, transparent, and tamper-proof enrollment

## Architecture

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Frontend      │   Backend API   │ Smart Contracts │
│   (Next.js)     │   (Node.js)     │   (Solidity)    │
├─────────────────┼─────────────────┼─────────────────┤
│ Study Creation  │ FHIR Integration│ StudyFactory    │
│ Patient Portal  │ Database Layer  │ Study Contract  │
│ ZK Proof UI     │ Blockchain APIs │ ZK Verifier     │
└─────────────────┴─────────────────┴─────────────────┘
                           │
                  ┌─────────────────┐
                  │  ZK Circuits    │
                  │  (Circom)       │
                  │ Medical Proofs  │
                  └─────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js v22.7.1+**
- **[Bun](https://bun.sh/)** (recommended package manager)
- **Docker** (for local infrastructure)
- **Sepolia testnet ETH** (for deployment)

### Installation

```bash
git clone https://github.com/monark-community/zk-medical-data-exchange.git
cd zk-medical-data-exchange
bun install
```

### Local Development

```bash
# 1. Start backend API (requires DB connection)
bun run dev:api

# 2. Start frontend (in new terminal)
bun run dev:web

# 3. Open http://localhost:3000
```

## Available Scripts

### Development & Testing

```bash
# Frontend & Backend
bun run dev:web                    # Start Next.js frontend (port 3000)
bun run dev:api                    # Start backend API (port 3001)
bun run infra                      # Start local infrastructure (DB, ClickHouse)

# Smart Contracts & ZK Circuits
bun run deploy:contracts:local     # Deploy to local Hardhat network
bun run deploy:contracts:sepolia   # Deploy to Sepolia testnet

# Contract ABI Generation (API)
bun run build:contracts            # Generate TypeScript ABIs from compiled contracts

# Testing
bun run test:contracts             # All smart contract tests
bun run test:contracts:solidity    # Solidity unit tests
bun run test:contracts:nodejs      # TypeScript integration tests
bun run test:web                   # Frontend tests
bun run test:api                   # Backend API tests

# Code Quality
bun run lint                       # Lint entire monorepo
bun run lint:web                   # Lint frontend only
bun run lint:api                   # Lint backend only
```

### ZK Circuit Testing

```bash
# From repository root
bun run test:contracts:zk-proof      # Complete ZK proof workflow test

# Or from smart-contracts directory
cd packages/smart-contracts
bun run test:zk-proof               # Same test, run locally
```

## Project Structure

```
zk-medical-data-exchange/
├── apps/
│   ├── api/                      # Backend API (Node.js + PostgreSQL)
│   │   ├── src/controllers/      # API endpoints
│   │   ├── src/services/         # Business logic
│   │   └── src/middleware/       # Auth, validation
│   └── web/                      # Frontend (Next.js + React)
│       ├── app/                  # App router pages
│       ├── components/           # UI components
│       └── services/             # API clients, blockchain
├── packages/
│   ├── shared/                   # Shared types and utilities
│   ├── smart-contracts/          # Solidity contracts + ZK circuits
│   │   ├── contracts/            # Smart contracts
│   │   ├── circuits/             # Circom ZK circuits
│   │   └── test/                 # Contract tests
│   └── subgraph/                 # The Graph indexing
└── infra/
    └── docker-compose.yaml       # Local development infrastructure
```

## Zero-Knowledge Workflow

1. **Study Creation** - Researchers define eligibility criteria
2. **Patient Data** - Patients input medical data locally
3. **Proof Generation** - ZK circuit creates eligibility proof
4. **On-Chain Verification** - Smart contract verifies proof
5. **Study Enrollment** - Eligible patients join without data disclosure

## Key Features

### For Researchers

- **Study Management** - Create studies with custom eligibility criteria
- **Privacy-Preserving Recruitment** - Verify eligibility without accessing patient data
- **Blockchain Transparency** - Immutable record of enrollments and study parameters

### For Patients

- **Data Sovereignty** - Medical data never leaves your control
- **Privacy-First Participation** - Prove eligibility without disclosure
- **Informed Consent** - Clear understanding of study requirements

### Technical Features

- **Groth16 ZK-SNARKs** - Efficient zero-knowledge proof system
- **FHIR Integration** - Standard medical data formats
- **Smart Contract Automation** - Decentralized study management
- **Scalable Architecture** - Modular monorepo design

## Deployment

### Local Testing

```bash
bun run deploy:contracts:local     # Deploy contracts locally
```

### Sepolia Testnet

```bash
bun run deploy:contracts:sepolia   # Deploy to Sepolia
# See packages/smart-contracts/SEPOLIA_DEPLOYMENT.md for details
```

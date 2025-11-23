# CURA

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub Issues](https://img.shields.io/github/issues/monark-community/zk-medical-data-exchange)](https://github.com/monark-community/zk-medical-data-exchange/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/monark-community/zk-medical-data-exchange)](https://github.com/monark-community/zk-medical-data-exchange/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/monark-community/zk-medical-data-exchange)](https://github.com/monark-community/zk-medical-data-exchange/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/monark-community/zk-medical-data-exchange)](https://github.com/monark-community/zk-medical-data-exchange/forks)

CURA is a privacy-first Web3 platform for medical research. It lets patients control their medical data while proving study eligibility with zero-knowledge cryptography and recording study actions on-chain.

## Overview

- End-to-end flow for privacy-preserving medical studies: data upload, compliance checks, ZK proof generation, and on-chain verification.
- Next.js frontend for patients and researchers, Node.js API for orchestration, and Solidity smart contracts for transparent governance.
- Uses FHIR standards, AES encryption at rest, IPFS for storage, Supabase for managed persistence, and Groth16 proofs for eligibility verification.

## Key Features

- Patient-controlled data sharing with AES-GCM encryption and wallet-derived keys
- Zero-knowledge proof-based study eligibility without revealing raw data
- Study lifecycle tooling: creation, governance, payouts, and audit trail logging
- Multi-environment support (local, Sepolia) with managed Supabase backend

## Project Structure

```
CURA/
├── apps/
│   ├── api/                      # Backend API (Node.js + Supabase)
│   │   ├── src/controllers/      # API endpoints
│   │   ├── src/middleware/       # Auth, validation
│   │   └── src/services/         # Business logic and integrations
│   └── web/                      # Frontend (Next.js + React)
│       ├── app/                  # App router pages
│       ├── components/           # UI components
│       └── services/             # API clients, blockchain, storage
├── packages/
│   ├── shared/                   # Shared types and utilities
│   └── smart-contracts/          # Solidity contracts + Circom ZK circuits
│       ├── contracts/            # Smart contracts
│       ├── circuits/             # Circom ZK circuits
│       └── test/                 # Contract and proof tests
```

## Getting Started

Prerequisites:

- Node.js v22.7.1+ and Bun
- Supabase project (SUPABASE_URL, SUPABASE_ANON_KEY)
- Sepolia testnet ETH and RPC URL (for network deployments)

Setup:

```bash
git clone https://github.com/monark-community/zk-medical-data-exchange.git
cd zk-medical-data-exchange
bun install
```

Run locally:

```bash
# Start backend API (ensure Supabase env vars are set)
bun run dev:api

# Start frontend (in another terminal)
bun run dev:web
```

## Available Scripts

Root scripts:

```bash
bun run dev:web                # Next.js frontend (apps/web)
bun run dev:api                # Backend API (apps/api)
bun run deploy:contracts:local # Deploy smart contracts to local Hardhat
bun run deploy:contracts:sepolia # Deploy smart contracts to Sepolia
bun run generate:abis          # Generate ABIs for the API
bun run lint                   # Lint all workspaces
bun run test:web               # Frontend tests
bun run test:api               # Backend tests
bun run test:contracts         # Contract test suite
bun run test:contracts:zk-proof # ZK proof workflow test
bun run coverage               # Monorepo coverage (bun test --coverage)
```

See workspace package.json files for additional commands in `apps/api`, `apps/web`, and `packages/smart-contracts`.

## Deployment

- Local: configure Supabase environment variables, then run `bun run dev:api` and `bun run dev:web`. Use `bun run deploy:contracts:local` for local Hardhat deployments.
- Sepolia: configure RPC URL and keys in environment variables, then run `bun run deploy:contracts:sepolia`. Frontend and API consume generated ABIs from `bun run generate:abis`.

## Documentation

- Frontend details: [apps/web/README.md](apps/web/README.md)
- Backend details: [apps/api/README.md](apps/api/README.md)
- Shared types and utilities: [packages/shared/README.md](packages/shared/README.md)
- Smart contracts and circuits: [packages/smart-contracts/README.md](packages/smart-contracts/README.md)

## Contribution

See [CONTRIBUTION.md](./CONTRIBUTION.md) to learn about contributions guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) to learn about the code of conduct.

## License

See the [LICENSE](./LICENSE) file to learn more about this project's licensing.

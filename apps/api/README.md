# CURA - Backend API (apps/api)

Node.js/Express backend API for the privacy-preserving medical research platform. Provides study management, medical data storage, audit logging, governance, and IPFS utilities backed by Supabase and on-chain contracts.

## Quick Start

```bash
# From repo root
bun install

# Start development server (from repo root)
bun run dev:api

# API available at http://localhost:3001
```

### Required Environment

Set these in `.env` (see `.env.example` in this folder):

- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SEPOLIA_PRIVATE_KEY`
- `SEPOLIA_RPC_URL`
- `STUDY_FACTORY_ADDRESS`
- `ZK_VERIFIER_ADDRESS`
- `AUDIT_TRAIL_ADDRESS`
- `GOVERNANCE_DAO_ADDRESS`

## Architecture

### Core Features

- **RESTful API Design** - Clean, conventional endpoints
- **Study Management** - CRUD + participation, consent, and aggregation flows
- **FHIR Integration** - Medical data processing and validation
- **Blockchain Integration** - Study deployments, payouts, governance, and audit trails
- **Storage Layer** - Supabase for persistence, Pinata/IPFS for encrypted payloads

### API Endpoints

```
POST   /auth/verify                        # Web3Auth JWT verification -> session token

GET    /medical-data                       # List encrypted CIDs for a wallet
POST   /medical-data                       # Upload encrypted CID + metadata
DELETE /medical-data                       # Delete encrypted CID

GET    /studies                            # List studies (filters, pagination)
GET    /studies/:id                        # Study details
POST   /studies                            # Create study
PATCH  /studies/:id                        # Update study
DELETE /studies/:id                        # Delete study
POST   /studies/:id/deployment             # Deploy study to chain
POST   /studies/:id/participate            # Enroll in study
POST   /studies/:id/consent/grant          # Grant consent
POST   /studies/:id/consent/revoke         # Revoke consent
GET    /studies/enrolled/:walletAddress    # Studies a user is enrolled in
POST   /studies/:id/challenge              # Request data commitment challenge
POST   /studies/:id/access-log             # Log study data access
GET    /studies/:id/aggregate              # Aggregate FHIR data for a study

GET    /audit                              # Audit records
POST   /audit                              # Create audit record

GET    /governance/stats                   # Governance stats
GET    /governance/proposals               # List proposals
GET    /governance/proposals/:id           # Proposal details
POST   /governance/proposals               # Create proposal
POST   /governance/proposals/:id/vote      # Cast vote
GET    /governance/users/:wallet/proposals # User proposals
GET    /governance/users/:wallet/votes     # User votes

GET    /ipfs/file/:cid                     # Download file via Pinata gateway
DELETE /ipfs/file/:cid                     # Delete file

POST   /transaction/receipt                # Store on-chain transaction receipt
```

### Project Structure

```
src/
├── controllers/                # Route handlers (auth, study, medicalData, governance, audit, ipfs, transaction)
├── routes/                     # Express routers wired in index.ts
├── middleware/                 # Token/session validation, Supabase client
├── services/                   # Supabase access, blockchain/Pinata integrations, domain logic
├── config/                     # Environment configuration
└── utils/                      # Logger, helpers
```

## Development

```bash
# Start API (requires Supabase env vars)
bun run dev                    # Start API server

# Testing
bun run test                   # Run API tests

# Type checking
npx tsc --noEmit
```

## Dependencies

- **Express.js** - Web framework
- **Supabase** - Managed database and storage
- **Pinata/IPFS** - Content storage for encrypted payloads
- **Ethers.js / Viem** - Blockchain integration
- **TypeScript** - Type safety

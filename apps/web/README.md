# CURA - Frontend (apps/web)

Next.js (App Router) frontend for the privacy-preserving medical research platform. Provides patient dashboards, file management, study discovery, and governance UX on top of the CURA API and smart contracts.

## Quick Start

```bash
# From repo root
bun install

# Start development server (Turbopack)
bun run dev:web

# Open http://localhost:3000
```

### Required Environment

Set these in `.env.local` (see `.env.example` in this folder):

- `NEXT_PUBLIC_APP_API_URL` – API base URL (e.g., http://localhost:3001)
- `NEXT_PUBLIC_PINATA_GATEWAY` – IPFS gateway base URL
- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` – Web3Auth client ID
- `NEXT_PUBLIC_DISPERSE_ADDRESS` – Disperse contract address
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` – Sepolia RPC URL

## Architecture

### Key Features

- **File Management** - Encrypt, upload, view, download, and delete medical data (AES + IPFS/Pinata)
- **Study Flows** - Browse studies, enrollment, consent management, and data challenges
- **Governance** - Proposal listing/details and voting UX
- **Dashboards** - Patient stats, breakthroughs, and research highlights
- **Wallet Integration** - Web3Auth login with wagmi/viem for on-chain actions

### Service Layer

```
services/
├── api/                       # Backend API clients
│   ├── studyService.ts        # Study CRUD, enrollment, consent, challenges
│   ├── dataVaultService.ts    # Medical data CIDs (upload/list/delete)
│   ├── auditService.ts        # Audit log writes
│   ├── governanceService.ts   # Proposals, votes, governance stats
│   ├── ipfsService.ts         # IPFS/Pinata helpers
│   ├── transactionService.ts  # Store transaction receipts
│   ├── userService.ts         # User profile/session helpers
│   └── index.ts               # Exports
├── core/
│   └── apiClient.ts           # Axios client with auth/session handling
├── fhir/
│   ├── fhirDataExtractor.ts   # FHIR validation and extraction
│   ├── fhirToZkMappings.ts    # Map FHIR to ZK inputs
│   └── types/                 # FHIR and aggregation types
├── storage/
│   └── aesKeyStore.ts         # In-memory AES key cache
└── zk/
    ├── commitmentGenerator.ts # Commitment helpers
    ├── zkProofGenerator.ts    # ZK proof utilities
    └── binMembership.ts       # Merkle/bin membership helpers
```

## Development

```bash
# Development server (Turbopack)
bun run dev:web

# Type checking
npx tsc --noEmit

# Linting
bun run lint

# Tests
bun run test
```

## Key Components

- **CustomNavbar / Landing** - Marketing, navigation, hero, and stats sections
- **Dashboard Tabs** - Research, breakthroughs, governance, profile pages
- **File Management** - UploadSection, FileOperationDropDown, record type selection
- **TxStatusOverlay** - Global transaction status toasts/overlays
- **Study UI** - StudyCreationForm/Modal, TemplateSelector, RangeInput, study tables
- **Governance** - Proposal lists, detail, and voting components

## Integration

- **Backend API** - http://localhost:3001 (Supabase-backed)
- **Smart Contracts** - Ethereum/Sepolia via wagmi/viem
- **Auth** - Web3Auth modal for wallet/session bootstrap
- **Storage** - IPFS/Pinata for encrypted file payloads
- **FHIR Services** - Medical data processing

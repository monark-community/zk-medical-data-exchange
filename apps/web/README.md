# ZK Medical Data Exchange - Frontend

Next.js frontend application for the privacy-preserving medical research platform.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

## Architecture

### Key Features

- **Study Creation** - Create medical research studies with eligibility criteria
- **Patient Portal** - FHIR data upload and ZK proof generation
- **Template System** - Pre-configured study templates (Diabetes, Hypertension, etc.)
- **Modern UI** - Professional design with loading states and visual feedback

### Service Layer

```
services/
├── api/
│   ├── StudyService.ts     # Consolidated study operations
│   └── dataVaultService.ts # Data vault integration
├── core/
│   └── apiClient.ts        # HTTP client configuration
├── fhir/
│   └── ...                 # FHIR data processing
└── storage/
    └── ...                 # Local storage utilities
```

### Recent Improvements

- Consolidated service architecture (StudyService.ts)
- RESTful API design
- TypeScript type safety
- Modern UI with loading states
- Template selection feedback

## Development

```bash
# Development server
bun run dev

# Type checking
npx tsc --noEmit

# Linting
bun run lint
```

## Key Components

- **StudyCreationForm** - Main study creation interface
- **StudyCreationModal** - Inline study creation
- **TemplateSelector** - Study template selection
- **RangeInput** - Medical criteria input fields

## Integration

- **Backend API** - http://localhost:3001
- **Smart Contracts** - Ethereum/Sepolia integration
- **FHIR Services** - Medical data processing

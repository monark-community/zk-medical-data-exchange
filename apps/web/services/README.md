# Frontend Services Architecture

Clean, modular service layer for the ZK Medical Data Exchange frontend.

## Structure

```
services/
├── api/                    # External API communication
│   ├── StudyService.ts    # Consolidated study operations
│   ├── dataVaultService.ts # Data vault integration
│   └── index.ts           # Service exports
├── core/                   # Core infrastructure
│   └── apiClient.ts       # HTTP client configuration
├── fhir/                   # Medical data processing
│   ├── fhirIntegrationService.ts
│   └── fhirToZkMappings.ts
└── storage/                # Local storage utilities
    └── ...
```

## Service Descriptions

### API Services (`api/`)

#### **StudyService.ts** - Consolidated Study Operations

- **Purpose**: Single source of truth for all study-related API calls
- **Functions**:
  - `getStudies()` - List studies with filtering
  - `getStudyDetails()` - Get detailed study information
  - `createStudy()` - Create new medical study
  - `deployStudy()` - Deploy study to blockchain
  - `updateStudyStatus()` - Update study metadata
  - `participateInStudy()` - Handle patient enrollment
  - `checkPatientEligibilityForStudy()` - Eligibility verification
  - `formatStudyCriteria()` - Format criteria for display
- **React Hook**: `useCreateStudy()` - Component integration

#### **dataVaultService.ts** - Data Vault Integration

- **Purpose**: Handle secure data storage operations
- **Functions**: Encrypted data operations

### Core Services (`core/`)

#### **apiClient.ts** - HTTP Client

- **Purpose**: Centralized HTTP configuration
- **Features**: Request/response interceptors, error handling

### FHIR Services (`fhir/`)

#### **fhirIntegrationService.ts** - Medical Data Processing

- **Purpose**: Convert FHIR data for ZK proofs
- **Functions**: Medical data validation and transformation

#### **fhirToZkMappings.ts** - Data Mappings

- **Purpose**: Map FHIR standards to ZK circuit inputs
- **Functions**: Type-safe medical data conversions

## Recent Improvements

### Service Consolidation

- **Before**: Separate `studyService.ts` and `studyApiService.ts` files
- **After**: Single `StudyService.ts` with clear organization
- **Benefits**:
  - Eliminated duplicate functionality
  - Single import path for components
  - Better code organization
  - Improved maintainability

### API Architecture

- **RESTful Design**: Proper HTTP verbs and resource naming
- **Type Safety**: Full TypeScript typing throughout
- **Error Handling**: Consistent error responses
- **React Integration**: Clean hooks for component usage

## Usage Examples

### Study Creation

```typescript
import { useCreateStudy } from "@/services/api/StudyService";

const { createStudy } = useCreateStudy();
const result = await createStudy(title, description, maxParticipants, duration, criteria);
```

### Study Deployment

```typescript
import { deployStudy } from "@/services/api/StudyService";

const deployResult = await deployStudy(studyId);
```

### Study Listing

```typescript
import { getStudies } from "@/services/api/StudyService";

const studies = await getStudies({ status: "active", page: 1 });
```

## Design Principles

1. **Single Responsibility** - Each service has a clear, focused purpose
2. **Type Safety** - Full TypeScript typing prevents runtime errors
3. **Reusability** - Services can be used across multiple components
4. **Consistency** - Uniform patterns across all services
5. **Maintainability** - Clear organization makes updates easy

## Service Evolution

The service layer has evolved to provide:

- **Better Organization** - Related functions grouped together
- **Cleaner Imports** - Single import path per domain
- **Type Safety** - Comprehensive TypeScript definitions
- **Error Handling** - Consistent error management
- **React Integration** - Clean hooks for component usage

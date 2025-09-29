# Complete Study Flow Implementation

This document explains the complete study management system we've built, including how to test the end-to-end flow.

## Architecture Overview

We've implemented a **hybrid architecture** that combines the best of both blockchain and traditional databases:

- **Relational Database (Supabase)**: For fast queries, search, filtering, and UI performance
- **Blockchain**: For trust, immutability, and ZK proof verification
- **ZK-SNARKs**: For privacy-preserving eligibility verification

## System Components

### 1. Database Schema (`/apps/api/src/schemas/studySchema.ts`)

**Studies Table**:

- Basic study info (title, description, max participants)
- Eligibility criteria (serialized for performance)
- Status tracking (draft → deploying → active → completed)
- Blockchain references (contract address, deployment tx)
- Performance optimizations (indexed fields, criteria summary)

**Participation Table**:

- Links participants to studies
- Stores ZK proofs and verification results
- Tracks eligibility scores and matched criteria

### 2. Complete API Controller (`/apps/api/src/controllers/studyController.ts`)

**Full CRUD Operations**:

- `POST /studies` - Create study with templates or custom criteria
- `GET /studies` - List studies with filtering/pagination
- `GET /studies/:id` - Get detailed study information
- `PATCH /studies/:id` - Update study (status, deployment info)
- `POST /studies/:id/participate` - Submit participation with ZK proof

**Features**:

- Template system (CARDIAC_RESEARCH, DIABETES_RESEARCH, etc.)
- Criteria validation and complexity scoring
- Participant eligibility checking
- ZK proof verification
- Comprehensive error handling

### 3. Frontend Services (`/apps/web/services/api/studyService.ts`)

**React Integration**:

- `useStudies()` - Hook for study listing with loading states
- `useStudyDetails()` - Hook for individual study details
- `useStudyParticipation()` - Hook for participation workflow

**API Functions**:

- `getStudies()` - Fetch studies with filtering
- `checkPatientEligibilityForStudy()` - FHIR-based eligibility checking
- `participateInStudy()` - Submit participation request
- Helper utilities for criteria formatting and status display

### 4. Comprehensive Testing (`/apps/web/test/studyFlowTest.ts`)

**End-to-End Test Suite**:

- Study creation with different templates
- Patient eligibility verification using FHIR data
- ZK proof generation workflow
- Participation submission and verification
- Edge case handling (study full, ineligible patients)

## How to Test the Complete Flow

### Prerequisites

1. **Start the API server**:

   ```bash
   cd apps/api
   npm run dev
   ```

2. **Set up environment variables** (`.env.local` in API):

   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   APP_API_KEY=your_api_key
   ```

3. **Create database tables** (run once):
   ```bash
   cd apps/api
   node -r ts-node/register src/utils/setupDatabase.ts
   ```

### Test Execution

#### Option 1: Run Complete Test Suite

```bash
cd apps/web
npm run test:study-flow
# or
npx ts-node scripts/testStudyFlow.ts
```

#### Option 2: Manual API Testing

**Create a Study**:

```bash
curl -X POST http://localhost:3001/api/studies \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "title": "Heart Health Study",
    "templateName": "CARDIAC_RESEARCH",
    "maxParticipants": 100
  }'
```

**List Studies**:

```bash
curl http://localhost:3001/api/studies \
  -H "x-api-key: your_api_key"
```

**Participate in Study**:

```bash
curl -X POST http://localhost:3001/api/studies/1/participate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "participantWallet": "0x1234...",
    "matchedCriteria": ["age", "gender"],
    "eligibilityScore": 85
  }'
```

### What Gets Tested

✅ **Study Creation**:

- Template-based studies (CARDIAC_RESEARCH, DIABETES_RESEARCH)
- Custom criteria studies
- Validation of criteria parameters
- Complexity scoring and categorization

✅ **Patient Eligibility**:

- FHIR data processing and validation
- Medical criteria matching (age, gender, conditions)
- ZK-ready value extraction
- Eligibility scoring algorithm

✅ **Participation Flow**:

- Study capacity checking
- Duplicate participation prevention
- ZK proof verification (mock implementation)
- Database updates and participant tracking

✅ **Edge Cases**:

- Invalid study criteria
- Ineligible patients
- Study capacity limits
- Missing required fields

## Expected Test Output

When running the complete test, you should see:

```
🚀 Starting Complete Study Flow Test...

📊 Testing Study Creation...
✅ Created cardiac study with ID: 1
✅ Created diabetes study with ID: 2
✅ Created custom age study with ID: 3

👥 Testing Patient Eligibility...
✅ Patient eligible for cardiac study
✅ Patient ineligible for diabetes study (as expected)
✅ Patient meets age criteria for custom study

🔐 Testing ZK Participation...
✅ Successfully participated in cardiac study
✅ Correctly rejected duplicate participation
✅ Study participant count updated

🎉 All tests completed successfully!
```

## Architecture Benefits

**Performance**: Database queries for UI are fast and support complex filtering
**Trust**: Blockchain provides immutable audit trail and decentralized verification  
**Privacy**: ZK-SNARKs enable eligibility verification without revealing medical data
**Scalability**: Database handles high-volume queries; blockchain handles verification
**Flexibility**: Easy to add new study templates and criteria types

## Next Steps

1. **Deploy to Supabase**: Create the database tables in your production environment
2. **Blockchain Integration**: Connect to actual smart contracts for study deployment
3. **ZK Circuit Integration**: Replace mock ZK proof with real Groth16 circuit
4. **Frontend UI**: Build React components using the service hooks provided
5. **Testing**: Run the complete test suite to validate your setup

This system provides a solid foundation for privacy-preserving medical research with excellent performance characteristics.

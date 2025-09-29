# StudyFactory Blockchain Integration

This directory contains the complete blockchain integration services for deploying medical studies to the StudyFactory smart contract.

## 📁 Files Overview

### Core Services

- **`studyFactoryService.ts`** - Direct interface to StudyFactory smart contract
- **`studyOrchestrationService.ts`** - Complete flow orchestration (DB → Blockchain → DB Update)
- **`studyIntegrationExamples.ts`** - Usage examples and patterns

### Existing Services

- **`studyCriteriaService.ts`** - Study criteria form mapping service

## 🚀 Quick Start

### 1. Complete Automated Flow

```typescript
import { createStudyOrchestrationService } from "./studyOrchestrationService";
import { createCriteria } from "@zk-medical/shared";

const orchestrator = createStudyOrchestrationService("/api");

const result = await orchestrator.createStudyComplete({
  title: "My Medical Study",
  maxParticipants: 100,
  principalInvestigator: "0x742d35Cc6869C3D0C5d3c8e0C3c2E8B6A9D5F4E2",
  eligibilityCriteria: createCriteria({
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
  }),
});

console.log("Study deployed:", result.studyContractAddress);
```

### 2. Manual Two-Step Approach

```typescript
// Step 1: Save to database
const dbResponse = await fetch("/api/studies", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(studyData),
});
const { id } = await dbResponse.json();

// Step 2: Deploy to blockchain
const orchestrator = createStudyOrchestrationService("/api");
const result = await orchestrator.retryBlockchainDeployment(id);
```

### 3. React Hook Usage

```typescript
import { useStudyOrchestration } from "./studyOrchestrationService";

function StudyCreationForm() {
  const { createStudy, isLoading, error, currentPhase } = useStudyOrchestration();

  const handleSubmit = async (formData) => {
    try {
      const result = await createStudy(formData);
      // Handle success
    } catch (err) {
      // Error already available in hook state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isLoading && <p>Phase: {currentPhase}</p>}
      {error && <p>Error: {error}</p>}
      <button disabled={isLoading}>Create Study</button>
    </form>
  );
}
```

## 📋 Configuration

### Environment Variables

```bash
# Sepolia Testnet (Development)
NEXT_PUBLIC_STUDY_FACTORY_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_ZK_VERIFIER_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY

# Ethereum Mainnet (Production)
NEXT_PUBLIC_STUDY_FACTORY_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_ZK_VERIFIER_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY
```

### Network Support

- **Sepolia Testnet (11155111)** - Development and testing
- **Ethereum Mainnet (1)** - Production deployment

## 🔄 Study Lifecycle Phases

### Orchestrated Flow

1. **Database Save** - Study saved in draft state
2. **Blockchain Deploy** - StudyFactory.createStudy() called
3. **Database Update** - Contract address and deployment hash saved
4. **Status: Active** - Study ready for participants

### Error Handling

```typescript
try {
  const result = await orchestrator.createStudyComplete(request);
} catch (error) {
  switch (error.phase) {
    case "database_save":
      // No cleanup needed
      break;
    case "blockchain_deploy":
      // Database record exists, can retry
      console.log("Study ID:", error.databaseStudyId);
      break;
    case "database_update":
      // Blockchain succeeded, manual intervention needed
      console.log("TX Hash:", error.transactionHash);
      break;
  }
}
```

## 🔧 Advanced Usage

### Custom Contract Interaction

```typescript
import { createStudyFactoryService } from "./studyFactoryService";

const service = createStudyFactoryService(11155111); // Sepolia
await service.initialize();

// Direct contract calls
const isAuthorized = await service.isAuthorizedCreator("0x...");
const studies = await service.getAllStudies();
const study = await service.getStudyById(0);
```

### Retry Failed Deployments

```typescript
// Get study status
const status = await orchestrator.getStudyStatus(studyId);

if (status.status === "failed") {
  // Retry blockchain deployment
  const result = await orchestrator.retryBlockchainDeployment(studyId);
}
```

### Status Monitoring

```typescript
const status = await orchestrator.getStudyStatus(studyId);

switch (status.status) {
  case "draft": // Saved but not deployed
  case "deploying": // Currently deploying
  case "active": // Fully deployed
  case "failed": // Deployment failed
}
```

## 🏗️ Architecture

### Service Layer Design

```
Frontend Components
       ↓
Study Orchestration Service  ← Main entry point
       ↓                ↓
   Database API    StudyFactory Service
                          ↓
                   StudyFactory Contract
```

### Data Flow

```
1. Frontend Form → StudyCreationRequest
2. Orchestrator → Database (draft)
3. Orchestrator → Blockchain (deploy)
4. Orchestrator → Database (update with contract info)
5. Result → Frontend (success/error)
```

## 🧪 Testing

### Prerequisites

1. **Database Setup** - Ensure PostgreSQL with study schema
2. **Wallet Connection** - MetaMask or similar for transactions
3. **Network Access** - Sepolia testnet RPC access
4. **Contract Deployment** - StudyFactory deployed on target network

### Test Flow

```typescript
import {
  createCompleteStudyExample,
  createStudyManualSteps,
  checkStudyStatus,
} from "./studyIntegrationExamples";

// Test complete automated flow
await createCompleteStudyExample();

// Test manual approach
await createStudyManualSteps();

// Check status
await checkStudyStatus(studyId);
```

## 🚨 Error Scenarios

### Common Issues

1. **"Service not initialized"** - Call `initialize()` first
2. **"Not authorized to create studies"** - Wallet not whitelisted
3. **"Please switch to chain ID X"** - Wrong network selected
4. **"Transaction was rejected by user"** - User declined in wallet
5. **"Failed to save study to database"** - API/database connectivity

### Recovery Strategies

- **Phase 1 Failure** - Retry with corrected data
- **Phase 2 Failure** - Use `retryBlockchainDeployment()`
- **Phase 3 Failure** - Manual database correction may be needed

## 📝 Smart Contract ABI

The service uses a simplified ABI for compatibility:

```typescript
const STUDY_FACTORY_ABI = [
  "event StudyCreated(uint256 indexed studyId, address indexed studyContract, address indexed principalInvestigator, string title)",
  "function studyCount() view returns (uint256)",
  "function studies(uint256) view returns (address, string, address, uint256, bool)",
  "function createStudy(...) returns (uint256, address)",
];
```

## 🔐 Security Considerations

- **Private Keys** - Never hardcode wallet private keys
- **RPC Endpoints** - Use secure, reliable RPC providers
- **Authorization** - Verify wallet permissions before deployment
- **Input Validation** - Always validate study criteria ranges
- **Error Exposure** - Don't expose sensitive error details to frontend

## 📚 Related Documentation

- **Smart Contracts** - `packages/smart-contracts/README.md`
- **API Endpoints** - `apps/api/src/controllers/studyController.ts`
- **Database Schema** - `apps/api/src/schemas/studySchema.ts`
- **Frontend Integration** - `apps/web/services/api/studyService.ts`

## 🤝 Contributing

When adding new features:

1. **Update Types** - Extend interfaces in service files
2. **Add Examples** - Include usage examples
3. **Test Coverage** - Add test cases for new flows
4. **Documentation** - Update this README with new patterns
5. **Error Handling** - Consider all failure modes

## 📞 Support

For issues:

1. Check console logs for detailed error messages
2. Verify network configuration and contract addresses
3. Ensure database schema matches expected structure
4. Test with manual two-step approach to isolate issues

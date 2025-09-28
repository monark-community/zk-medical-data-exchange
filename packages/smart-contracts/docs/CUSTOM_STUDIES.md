# Creating Custom Medical Studies with ZK Verification

This guide shows how to use the StudyFactory to create medical studies with specific parameters and ZK proof verification.

## 🏗️ Study Creation Process

### 1. Deploy Core Infrastructure

```bash
# Deploy verifier and factory contracts
bun hardhat run scripts/deployStudyWithZK.ts --network hardhatOp
```

### 2. Create Custom Studies

```bash
# Create individual studies with custom parameters
bun hardhat run scripts/createCustomStudy.ts --network hardhatOp
```

## 📋 Study Parameters

### StudyFactory.createStudy() Parameters:

```solidity
function createStudy(
    string memory title,              // Study name/title
    string memory description,        // Study description (not stored on-chain)
    uint256 maxParticipants,         // Maximum number of participants
    uint256 startDate,               // Study start timestamp (not enforced)
    uint256 endDate,                 // Study end timestamp (not enforced)
    address principalInvestigator,   // PI address (for authorization)
    address zkVerifierAddress        // ZK verifier contract address
) returns (uint256 studyId, address studyAddress)
```

### Study Contract Configuration:

Each deployed Study contract has these eligibility criteria (enforced by ZK proofs):

```solidity
struct StudyCriteria {
    uint256 minAge;                  // Minimum age in years
    uint256 maxAge;                  // Maximum age in years
    uint256 minCholesterol;          // Min cholesterol (mg/dL)
    uint256 maxCholesterol;          // Max cholesterol (mg/dL)
    uint256 minBMI;                  // Min BMI * 10 (e.g., 25.5 = 255)
    uint256 maxBMI;                  // Max BMI * 10
    uint256[4] allowedBloodTypes;    // Allowed blood type IDs
}
```

## 🎯 Example Study Configurations

### Cardiovascular Research Study

```typescript
const cardiovascularStudy = {
  title: "Cardiovascular Risk Assessment Study",
  maxParticipants: 50,
  criteria: {
    minAge: 40,
    maxAge: 75,
    minCholesterol: 160,
    maxCholesterol: 300,
    minBMI: 200, // BMI 20.0
    maxBMI: 350, // BMI 35.0
    allowedBloodTypes: [1, 2, 3, 4, 5, 6, 7, 8], // All blood types
  },
};
```

### Diabetes Prevention Study

```typescript
const diabetesStudy = {
  title: "Type 2 Diabetes Prevention Trial",
  maxParticipants: 75,
  criteria: {
    minAge: 25,
    maxAge: 65,
    minCholesterol: 120,
    maxCholesterol: 250,
    minBMI: 250, // BMI 25.0 (pre-diabetic range)
    maxBMI: 400, // BMI 40.0
    allowedBloodTypes: [1, 2, 3, 4], // A+, A-, B+, B-
  },
};
```

### Pediatric Study

```typescript
const pediatricStudy = {
  title: "Childhood Obesity Prevention Study",
  maxParticipants: 200,
  criteria: {
    minAge: 8,
    maxAge: 17,
    minCholesterol: 100,
    maxCholesterol: 200,
    minBMI: 150, // BMI 15.0
    maxBMI: 300, // BMI 30.0
    allowedBloodTypes: [1, 2, 3, 4, 5, 6, 7, 8], // All blood types
  },
};
```

## 🔐 Blood Type Encoding

```
A+  = 1    AB+ = 5
A-  = 2    AB- = 6
B+  = 3    O+  = 7
B-  = 4    O-  = 8
```

## 🚀 Deployment Workflow

### Step 1: Deploy Infrastructure

```typescript
// Deploy ZK verifier (auto-generated from Circom circuit)
const verifier = await viem.deployContract("Groth16Verifier");

// Deploy study factory with open creation enabled
const factory = await viem.deployContract("StudyFactory", [true]);
```

### Step 2: Create Custom Study

```typescript
const studyTx = await factory.write.createStudy([
  "My Custom Study", // title
  "Study description", // description
  BigInt(100), // maxParticipants
  BigInt(Date.now()), // startDate
  BigInt(Date.now() + 365 * 24 * 3600 * 1000), // endDate (1 year)
  deployer.account.address, // principalInvestigator
  verifier.address, // zkVerifierAddress
]);
```

### Step 3: Get Study Address

```typescript
const events = await factory.getEvents.StudyCreated();
const studyAddress = events[events.length - 1].args.studyContract;
```

## 💡 Key Features

### ✅ **Privacy-Preserving Enrollment**

- Patients prove eligibility without revealing medical data
- ZK-SNARKs verify age, BMI, cholesterol, blood type
- No sensitive information stored on-chain

### ✅ **Flexible Study Criteria**

- Customize age ranges, BMI limits, cholesterol thresholds
- Restrict or allow specific blood types
- Set participant limits per study

### ✅ **Automated Verification**

- Groth16 proofs provide cryptographic guarantees
- Invalid proofs automatically rejected
- No manual eligibility checks required

### ✅ **Decentralized Management**

- Studies deployed as individual smart contracts
- Principal investigators have study-specific control
- Factory pattern for easy study creation

## 🔄 Patient Enrollment Flow

1. **Patient generates ZK proof** with their medical data
2. **Proof includes**: age, BMI, cholesterol, blood type, commitment
3. **Study contract verifies** proof matches eligibility criteria
4. **If valid**: Patient enrolled, commitment stored on-chain
5. **If invalid**: Transaction reverts, privacy preserved

## 📊 On-Chain Data

### What's Stored:

- Study metadata (title, max participants, PI address)
- Participant addresses (enrolled patients)
- Data commitments (hashed medical data)
- Eligibility criteria (public study requirements)

### What's NOT Stored:

- Actual medical data (age, BMI, cholesterol, etc.)
- Patient identities linked to medical information
- Any personally identifiable health information

This ensures **HIPAA compliance** and **privacy preservation** while enabling verifiable medical research enrollment!

# Data Commitment Workflow for ZK Proof Generation

## 🎯 Purpose
Data commitment prevents gaming attacks where patients might manipulate their medical data after seeing study criteria. This ensures fairness and data integrity in the medical study enrollment process.

## 🔒 How It Works

### Phase 1: Commitment (Before Criteria Revealed)

```typescript
import { generateDataCommitment, generateSecureSalt } from '@/services/zk/zkProofGenerator';

// 1. Patient uploads/extracts their medical data
const medicalData = await extractMedicalData(fhirBundle);

// 2. Generate cryptographically secure salt
const salt = generateSecureSalt(); // Returns a random number
// ⚠️ IMPORTANT: Store this salt securely! You'll need it for proof generation

// 3. Compute commitment using your existing commitmentGenerator
const commitment = generateDataCommitment(medicalData, salt);

// 4. Submit commitment to smart contract (BEFORE seeing full criteria)
await studyContract.commitData(studyId, commitment);
// This commitment is now stored on-chain and cannot be changed

// 5. Store salt securely (you MUST have this for Phase 2)
localStorage.setItem(`study_${studyId}_salt`, salt.toString());
```

### Phase 2: Proof Generation (After Criteria Revealed)

```typescript
import { generateZKProof } from '@/services/zk/zkProofGenerator';

// 1. Researcher reveals full study criteria
const studyCriteria = await studyContract.getStudyCriteria(studyId);

// 2. Retrieve stored salt from Phase 1
const saltString = localStorage.getItem(`study_${studyId}_salt`);
if (!saltString) {
  throw new Error('Salt not found! Cannot generate proof.');
}
const salt = parseInt(saltString);

// 3. Generate ZK proof using ORIGINAL data + stored salt
const proofResult = await generateZKProof(
  medicalData,    // Same data used for commitment
  studyCriteria,  // Now revealed
  commitment,     // Previously submitted commitment (BigInt)
  salt            // Salt from Phase 1 (number)
);

// 4. Submit proof to smart contract
if (proofResult.isEligible) {
  await studyContract.joinStudy(studyId, proofResult.proof);
}
```

## 🛡️ Security Guarantees

### What the Circuit Verifies:
1. **Commitment Match**: `Poseidon(medicalData + salt) === dataCommitment`
2. **Eligibility**: Patient's data meets study criteria
3. **Privacy**: Medical data remains private (zero-knowledge)

### What the Smart Contract Verifies:
1. **Proof Validity**: ZK proof is cryptographically valid
2. **Commitment Match**: Proof uses the commitment stored earlier
3. **Study Match**: Proof is for the correct study
4. **No Double Join**: Patient hasn't already joined

## 🚫 What This Prevents

### Attack 1: Data Manipulation
**Without Commitment:**
```typescript
// ❌ Patient sees: "Need age 18-25"
// Patient changes their data: age = 24 (was actually 30)
const proof = generateZKProof(modifiedData, criteria);
```

**With Commitment:**
```typescript
// ✅ Commitment was computed BEFORE criteria revealed
// If patient tries to change data, commitment won't match
// Circuit will reject: Poseidon(modifiedData + salt) ≠ originalCommitment
```

### Attack 2: Researcher Targeting
**Without Commitment:**
```typescript
// ❌ Researcher sees patient has rare blood type AB-
// Researcher creates study specifically for AB- blood type
// Looks like legitimate research, but is targeted
```

**With Commitment:**
```typescript
// ✅ Commitment is already on-chain
// Researcher can't see patient's data
// Must create genuine criteria before knowing who will match
```

### Attack 3: Data Shopping
**Without Commitment:**
```typescript
// ❌ Patient tries multiple studies
// Adjusts data slightly for each one
// Until finding one they qualify for
```

**With Commitment:**
```typescript
// ✅ One commitment per patient
// Can't change data between studies
// Must use same committed data for all proofs
```

## 📋 Implementation Checklist

### Frontend (Patient Side)
- [ ] Extract medical data from FHIR
- [ ] Generate cryptographically secure salt
- [ ] Compute Poseidon commitment
- [ ] Store salt securely (localStorage, encrypted wallet, etc.)
- [ ] Submit commitment to smart contract
- [ ] Wait for study criteria to be revealed
- [ ] Generate ZK proof with original data + salt
- [ ] Submit proof to join study

### Smart Contract
- [ ] Store patient commitments mapping: `mapping(address => uint256)`
- [ ] Verify commitment exists before accepting proof
- [ ] Verify proof's public signal matches stored commitment
- [ ] Prevent commitment reuse or modification
- [ ] Emit events for commitment submission and proof verification

### Circuit (Already Implemented ✅)
- [x] Accept dataCommitment as public input
- [x] Compute Poseidon hash of medical data + salt
- [x] Verify computed hash matches provided commitment
- [x] Output eligibility result

## ⚠️ Important Considerations

### Salt Storage
```typescript
// ❌ DON'T: Lose the salt
// If salt is lost, patient can't generate proof even with valid data

// ✅ DO: Store salt securely
localStorage.setItem(`study_${studyId}_salt`, salt);
// Or better: encrypt and store in wallet
```

### Commitment Timing
```typescript
// ❌ DON'T: Let patients see criteria before committing
if (criteriasPublic) {
  alert("Please commit your data before viewing criteria");
}

// ✅ DO: Enforce commitment before revealing criteria
const commitment = await submitCommitment();
const criteria = await revealCriteria(commitment);
```

### Gas Optimization
```typescript
// Store commitment hash (32 bytes) instead of full data
// Smart contract only needs to verify:
// proof.publicSignals[0] === storedCommitments[msg.sender]
```

## 🔄 Alternative: Simpler Approach (No Commitment)

If your threat model doesn't require this level of protection:

```typescript
// Just generate proof directly (study criteria must be public)
const proof = await generateZKProof(medicalData, studyCriteria);
```

**Use simple approach if:**
- Study criteria are always public before enrollment
- You trust patients won't manipulate data
- Simplicity > preventing data shopping

**Use commitment approach if:**
- Researchers need to analyze eligibility patterns first
- Risk of targeted criteria creation
- Regulatory requirements for data integrity proofs
- Need audit trail of when data existed

## 📚 Additional Resources

- [Circom Poseidon Hash](https://docs.circom.io/circom-language/circomlib/poseidon/)
- [Commitment Schemes in ZK](https://www.zkdocs.com/docs/zkdocs/commitments/)
- [Groth16 ZK-SNARKs](https://eprint.iacr.org/2016/260.pdf)

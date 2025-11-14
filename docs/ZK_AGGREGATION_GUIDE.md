# Zero-Knowledge Data Aggregation

## Overview

This document explains how ZK proofs eliminate the need to store encrypted medical data while still enabling statistical aggregation.

## The Problem with Encryption-Based Aggregation

### Old Approach (Encryption):
```
User → Encrypts Data → Sends to Server → Stored in DB
                                           ↓
Later: Server → Decrypts Data → Computes Statistics
```

**Issues:**
- ❌ Encrypted data in database (vulnerable if encryption keys compromised)
- ❌ Server must decrypt to aggregate (server sees raw medical data)
- ❌ Trust required in server security practices
- ❌ Data breach exposes encrypted data that could be decrypted

## The ZK Solution

### New Approach (Zero-Knowledge Proofs):
```
User → Generates ZK Proof → Sends Proof + Binned Values → Stored in DB
         (in browser)                                        ↓
Later: Server → Aggregates Binned Values → Statistics
        (Never sees raw data!)
```

**Benefits:**
- ✅ **NO raw data stored** - only ZK proofs + binned categories
- ✅ **Server NEVER sees raw data** - only aggregates public bins
- ✅ **Zero-trust architecture** - cryptographically guaranteed privacy
- ✅ **Data breach = no medical data** - proofs are useless without raw inputs
- ✅ **Users can't lie** - proofs verify data matches blockchain commitment

## How It Works

### Step 1: User Generates Proof (Browser-Side)

```typescript
// User's raw medical data (STAYS IN BROWSER - never sent to server)
const medicalData = {
  age: 45,                    // ← PRIVATE
  cholesterol: 220,           // ← PRIVATE
  bmi: 285,                   // ← PRIVATE
  hba1c: 68,                  // ← PRIVATE
  // ... other private fields
  salt: "random-salt-123",    // From enrollment
};

// Generate ZK proof
const { proof, publicSignals } = await zkAggregationService.generateAggregationProof(
  medicalData,
  studyId,
  dataCommitment  // From blockchain enrollment
);

// Public signals contain ONLY binned/categorized values:
console.log(publicSignals);
// {
//   ageBucket: "3",           // ← PUBLIC (means "40-50 years", not exact age)
//   cholesterolBucket: "1",   // ← PUBLIC (means "200-240", not exact value)
//   bmiBucket: "2",           // ← PUBLIC (means "overweight", not exact BMI)
//   hba1cBucket: "2",         // ← PUBLIC (means "diabetic range", not exact %)
//   // ...
// }
```

**Key Point:** The circuit converts `age: 45` → `ageBucket: "3"` (40-50 range) inside the proof generation. Server ONLY receives the bucket, never the raw age!

### Step 2: Server Verifies & Stores Proof

```typescript
// Server receives proof + public signals
POST /api/studies/123/submit-zk-proof
{
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
  "publicSignals": {
    "dataCommitment": "0x1234...",
    "studyId": "123",
    "ageBucket": "3",      // ← Binned value, NOT raw age
    "cholesterolBucket": "1",
    // ...
  }
}

// Server verifies proof:
const isValid = await groth16.verify(verificationKey, publicSignals, proof);
// ✅ Proof guarantees:
//    1. User's raw data matches their blockchain commitment
//    2. Binned values are correctly computed
//    3. User didn't lie or make up data

// Server stores in database:
INSERT INTO study_zk_aggregation_proofs (study_id, participant_address, proof, public_signals)
// ⚠️ NOTE: Raw medical data is NEVER stored!
```

### Step 3: Aggregate Statistics (No Decryption!)

```typescript
// When study ends, aggregate the binned values
POST /api/studies/123/aggregate-zk

// Server fetches all proofs:
const proofs = await db.select('public_signals')
  .from('study_zk_aggregation_proofs')
  .where('study_id', 123);

// Aggregate the PUBLIC binned values:
const stats = {
  ageDistribution: {
    "20-30": 0,
    "30-40": 0,
    "40-50": 0,  // ← Count participants in each bucket
    "50-60": 0,
    "60+": 0,
  },
  cholesterolDistribution: {
    "<200": 0,
    "200-240": 0,  // ← Count participants in each range
    ">240": 0,
  },
  // ...
};

proofs.forEach(({ public_signals }) => {
  const ageBucket = bucketMap[public_signals.ageBucket]; // "40-50"
  stats.ageDistribution[ageBucket]++;
  
  const cholBucket = bucketMap[public_signals.cholesterolBucket]; // "200-240"
  stats.cholesterolDistribution[cholBucket]++;
  // ...
});

// Result: Real statistics without ever seeing raw data!
```

## Privacy Guarantees

### What the Server NEVER Sees:
- ❌ Exact age (e.g., 45)
- ❌ Exact cholesterol (e.g., 220)
- ❌ Exact BMI (e.g., 28.5)
- ❌ Exact HbA1c (e.g., 6.8%)
- ❌ Any other raw medical values

### What the Server CAN See:
- ✅ Age bucket (e.g., "40-50 years")
- ✅ Cholesterol range (e.g., "200-240 mg/dL")
- ✅ BMI category (e.g., "overweight")
- ✅ HbA1c range (e.g., "diabetic")
- ✅ Categorical values (gender, blood type, etc.)

### Why This Preserves Privacy:

**k-Anonymity Through Binning:**
- Each bucket contains multiple possible values
- "Age 40-50" could be 40, 41, 42, ..., 50 (11 values)
- "Cholesterol 200-240" could be 200-240 (41 values)
- Attacker can't determine exact values

**Example:**
- Server knows: "3 participants in age bucket 40-50"
- Server DOESN'T know: Which one is 42, which is 47, which is 49
- Statistical aggregation works, but individual privacy preserved!

## Comparison with Encrypted Approach

| Aspect | Encryption-Based | ZK-Based |
|--------|-----------------|----------|
| **Data Storage** | Encrypted raw data in DB | Only proofs + binned values |
| **Server Access** | Decrypts to see raw data | NEVER sees raw data |
| **Breach Impact** | Encrypted data exposed | No medical data to expose |
| **Trust Model** | Trust server security | Zero-trust cryptography |
| **Privacy Guarantee** | Depends on encryption strength | Mathematical guarantee |
| **User Control** | Data leaves browser | Proof generated locally |
| **Aggregation** | Decrypt → Compute | Aggregate public bins |

## Circuit Design

The `data_aggregation.circom` circuit has three main parts:

### 1. Data Commitment Verification
```circom
// Prove raw data matches blockchain commitment
component commitment = Poseidon(...);
commitment.inputs[0] <== age;       // Private
commitment.inputs[1] <== gender;    // Private
// ...
dataCommitment === commitment.out;  // Public (on blockchain)
```

**Purpose:** Prevent users from lying about their data. The commitment was created when they joined the study, so they can't change it now.

### 2. Data Binning
```circom
// Convert raw values to bins (preserves privacy)
component ageLt40 = LessThan(8);
ageLt40.in[0] <== age;        // Private: 45
ageLt40.in[1] <== 40;

component ageLt50 = LessThan(8);
ageLt50.in[0] <== age;        // Private: 45
ageLt50.in[1] <== 50;

// ageBucket = 3 (means "40-50")
ageBucket <== calculateBucket(...);  // Public
```

**Purpose:** Convert exact values to ranges. This is done INSIDE the circuit, so the server never sees the exact value.

### 3. Public Output
```circom
signal output ageBucket;           // 3 (means "40-50")
signal output cholesterolBucket;   // 1 (means "200-240")
signal output bmiBucket;           // 2 (means "overweight")
// ...
```

**Purpose:** These are the ONLY values that become public. They're safe to aggregate because they're binned.

## Implementation Steps

### 1. Compile the Circuit
```bash
cd packages/smart-contracts/circuits
bun run compile
```

This generates:
- `data_aggregation.wasm` (proof generation)
- `data_aggregation_final.zkey` (proving key)
- `data_aggregation_verification_key.json` (verification)

### 2. Deploy Verification Key to Frontend
```bash
cp circuits/build/data_aggregation.wasm apps/web/public/circuits/
cp circuits/build/data_aggregation_final.zkey apps/web/public/circuits/
cp circuits/build/data_aggregation_verification_key.json apps/web/public/circuits/
```

### 3. User Flow

**Frontend (User's Browser):**
```typescript
import { zkAggregationService } from '@/services/zk/zkAggregationService';

// User clicks "Contribute to Study Statistics"
const handleContribute = async () => {
  // 1. Get user's medical data (from local storage, never sent to server before)
  const medicalData = await getMedicalDataFromStorage();
  
  // 2. Get data commitment from blockchain
  const dataCommitment = await getDataCommitmentFromBlockchain(userAddress, studyId);
  
  // 3. Generate ZK proof IN BROWSER
  const { proof, publicSignals } = await zkAggregationService.generateAggregationProof(
    medicalData,
    studyId,
    dataCommitment
  );
  
  // 4. Send proof to server (raw data NEVER leaves browser!)
  await fetch(`/api/studies/${studyId}/submit-zk-proof`, {
    method: 'POST',
    body: JSON.stringify({
      participantAddress: userAddress,
      proof,
      publicSignals,  // Only binned values
    }),
  });
  
  alert('Data contributed! Your exact values remain private.');
};
```

**Backend (Server):**
```typescript
import { zkAggregationService } from '@/services/zkDataAggregationService';

// POST /api/studies/:id/submit-zk-proof
// 1. Verify proof
// 2. Store proof + public signals (NOT raw data)

// POST /api/studies/:id/aggregate-zk
const result = await zkAggregationService.aggregateStudyData(studyId, studyAddress);
// Aggregates binned values without ever seeing raw data
```

## Security Analysis

### Attack Scenarios

**1. Database Breach:**
- **Encryption approach:** Attacker gets encrypted data, could decrypt if keys compromised
- **ZK approach:** Attacker gets proofs + binned values, no raw data to steal ✅

**2. Malicious Server:**
- **Encryption approach:** Server can decrypt and see all raw data
- **ZK approach:** Server only sees binned values, can't reconstruct raw data ✅

**3. User Lying:**
- **Encryption approach:** User could encrypt fake data
- **ZK approach:** Proof verifies data matches blockchain commitment, lying is impossible ✅

**4. Replay Attack:**
- **Encryption approach:** Could reuse encrypted data for different studies
- **ZK approach:** Proof includes studyId, can't be reused ✅

## Performance Considerations

### Proof Generation Time
- **Browser-side:** ~2-5 seconds (depending on device)
- **One-time cost:** Only when user contributes to study

### Proof Verification Time
- **Server-side:** ~50-100ms per proof
- **Batch verification:** Can verify multiple proofs in parallel

### Storage Comparison
```
Encryption approach:
- Encrypted data: ~5-10 KB per participant
- Encryption metadata: ~1 KB
- Total: ~6-11 KB per participant

ZK approach:
- Proof: ~1 KB
- Public signals: ~500 bytes
- Total: ~1.5 KB per participant
```

**ZK approach uses LESS storage while providing BETTER privacy!**

## Conclusion

**Why ZK Aggregation is Superior:**

1. **Stronger Privacy:** Server NEVER sees raw data (vs. temporarily seeing during decryption)
2. **Breach Resilience:** Database contains no medical data to steal
3. **Zero-Trust:** Cryptographic guarantees instead of trusting server
4. **User Control:** Data never leaves user's browser
5. **Integrity:** Users can't lie about their data
6. **Efficiency:** Less storage, comparable performance

**The Trade-off:**
- Initial setup complexity (circuit compilation, proof generation)
- But once set up, it's more secure AND more efficient than encryption!

This is the future of privacy-preserving medical data aggregation. 🔐

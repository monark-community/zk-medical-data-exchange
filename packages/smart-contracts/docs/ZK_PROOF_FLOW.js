/**
 * COMPLETE ZK PROOF FLOW FOR MEDICAL ELIGIBILITY
 * ===============================================
 *
 * This document explains the ENTIRE process from patient medical data
 * to blockchain verification through Study contract integration.
 */

// STEP 1: PATIENT HAS MEDICAL DATA (Private - Never Leaves Their Device)
// =====================================================================
const patientMedicalData = {
  age: 45,
  cholesterol: 180, // mg/dL
  bmi: 25.5, // Convert to integer: 255 (multiply by 10)
  bloodType: "O+", // Encode as: 7 (A+=1, A-=2, B+=3, B-=4, AB+=5, AB-=6, O+=7, O-=8)
  salt: "random_string", // For privacy/uniqueness
};

// STEP 2: STUDY PUBLISHES CRITERIA (Public - Everyone Can See)
// ============================================================
const studyCriteria = {
  minAge: 18,
  maxAge: 65,
  minCholesterol: 100,
  maxCholesterol: 200,
  minBMI: 180, // 18.0 * 10
  maxBMI: 300, // 30.0 * 10
  allowedBloodTypes: [7, 8, 0, 0], // O+ and O- allowed, others set to 0
};

// STEP 3: PATIENT GENERATES DATA COMMITMENT (Privacy Protection)
// =============================================================
import { poseidon } from "circomlibjs";

const dataCommitment = poseidon([
  patientMedicalData.age,
  patientMedicalData.cholesterol,
  Math.floor(patientMedicalData.bmi * 10), // Convert 25.5 to 255
  7, // O+ encoded as 7
  BigInt(patientMedicalData.salt),
]);
console.log("Data Commitment:", dataCommitment.toString());

// STEP 4: PREPARE CIRCUIT INPUTS (What Goes Into Circom Circuit)
// =============================================================
const circuitInputs = {
  // PRIVATE INPUTS (Never revealed!)
  age: patientMedicalData.age,
  cholesterol: patientMedicalData.cholesterol,
  bmi: Math.floor(patientMedicalData.bmi * 10),
  bloodType: 7,
  salt: BigInt(patientMedicalData.salt),

  // PUBLIC INPUTS (Visible to everyone)
  minAge: studyCriteria.minAge,
  maxAge: studyCriteria.maxAge,
  minCholesterol: studyCriteria.minCholesterol,
  maxCholesterol: studyCriteria.maxCholesterol,
  minBMI: studyCriteria.minBMI,
  maxBMI: studyCriteria.maxBMI,
  allowedBloodType1: studyCriteria.allowedBloodTypes[0],
  allowedBloodType2: studyCriteria.allowedBloodTypes[1],
  allowedBloodType3: studyCriteria.allowedBloodTypes[2],
  allowedBloodType4: studyCriteria.allowedBloodTypes[3],
  dataCommitment: dataCommitment,
};

// STEP 5: GENERATE ZK PROOF (Client-Side with snarkjs)
// ===================================================
import snarkjs from "snarkjs";

async function generateProof() {
  console.log("🔄 Generating ZK proof...");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    "/path/to/medical_eligibility.wasm", // Compiled circuit
    "/path/to/medical_eligibility.zkey" // Proving key from trusted setup
  );

  console.log("✅ Proof generated!");
  console.log("Public Signals:", publicSignals);

  return { proof, publicSignals };
}

// STEP 6: FORMAT PROOF FOR SOLIDITY (Convert to Contract Format)
// ==============================================================
function formatProofForSolidity(proof) {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: reversed order for Solidity
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
}

// STEP 7: SUBMIT TO STUDY CONTRACT (Blockchain Transaction)
// =========================================================
async function joinStudy(proof, publicSignals) {
  const solidityProof = formatProofForSolidity(proof);

  // Extract data commitment from public signals
  const dataCommitment = publicSignals[10]; // Index depends on your circuit

  console.log("📡 Submitting to Study contract...");

  // Call Study contract's joinStudy function
  const tx = await studyContract.joinStudy(
    solidityProof, // ZK proof in Solidity format
    dataCommitment // Hash of patient's private data
  );

  console.log("✅ Transaction submitted:", tx.hash);
  return tx;
}

// STEP 8: STUDY CONTRACT VERIFICATION PROCESS
// ===========================================
/*
When Study.joinStudy() is called:

1. Study contract receives:
   - solidityProof: {a: [x,y], b: [[x1,y1],[x2,y2]], c: [x,y]}
   - dataCommitment: hash of patient's private data

2. Study contract prepares public inputs array:
   publicInputs = [
       criteria.minAge,           // 18
       criteria.maxAge,           // 65
       criteria.minCholesterol,   // 100
       criteria.maxCholesterol,   // 200
       criteria.minBMI,           // 180
       criteria.maxBMI,           // 300
       criteria.allowedBloodTypes[0], // 7 (O+)
       criteria.allowedBloodTypes[1], // 8 (O-)
       criteria.allowedBloodTypes[2], // 0
       criteria.allowedBloodTypes[3], // 0
       dataCommitment,            // Patient's data hash
       1                          // Expected output: eligible = 1
   ];

3. Study contract calls MedicalZKVerifier:
   bool isEligible = zkVerifier.verifyEligibilityProof(proof, publicInputs);

4. MedicalZKVerifier performs Groth16 verification:
   - Uses the verifying key from trusted setup
   - Verifies the mathematical proof equation
   - Returns true if proof is valid AND patient is eligible

5. If verification succeeds:
   - Patient is added to study participants
   - Their dataCommitment is stored (for consistency checks)
   - NO private medical data is ever revealed or stored!
*/

// COMPLETE FLOW SUMMARY:
// ======================
/*
Patient Side (Private):
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Medical Data    │───▶│ Circom Circuit   │───▶│ ZK Proof        │
│ age=45          │    │ + snarkjs        │    │ {a,b,c} points  │
│ cholesterol=180 │    │                  │    │                 │
│ bmi=25.5        │    │                  │    │                 │
│ bloodType=O+    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘

Blockchain Side (Public):
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Study Contract  │───▶│ ZK Verifier      │───▶│ ✅ Eligible     │
│ criteria={...}  │    │ Groth16 verify   │    │ Add participant │
│ joinStudy()     │    │                  │    │ NO data stored! │
└─────────────────┘    └──────────────────┘    └─────────────────┘

MAGIC: Blockchain knows patient is eligible but never learns their actual medical data! 🔐
*/

export { patientMedicalData, studyCriteria, generateProof, formatProofForSolidity, joinStudy };

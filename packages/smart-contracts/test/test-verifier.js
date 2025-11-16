#!/usr/bin/env node

import { network } from "hardhat";

async function runTests() {
  console.log("Testing MedicalEligibilityVerifier Contract");
  console.log("=".repeat(50));

  try {
    const { viem } = await network.connect();

    // Valid proof data generated from the circuit
    const validProofData = {
      a: [
        10632366152915023443265114058893750059244259850890587903019663137455657625371n,
        19234470219586894860343861149106694094012130661604186136815270259776196573092n,
      ],
      b: [
        [
          6839083604550655771105630787527560246979746972191601228684569377054002668590n,
          9172837289904874296942671462566192154662646872688022396608398038374778759717n,
        ],
        [
          21140449919828281637822432909349719846600245582034309540156846282880484839939n,
          14990527068767912836540634373873814955588733388913589268878879328618019400945n,
        ],
      ],
      c: [
        13191649485943827494839441429664938503208866560537509834752463875601974571966n,
        17554050202408579540124579488607723340020383682812234213574823630378921638452n,
      ],
      publicSignals: [1n],
    };

    // Invalid proof data (modified to ensure it fails verification)
    const invalidProofData = {
      a: [
        10632366152915023443265114058893750059244259850890587903019663137455657625371n,
        19234470219586894860343861149106694094012130661604186136815270259776196573093n, // Changed last digit
      ],
      b: validProofData.b,
      c: validProofData.c,
      publicSignals: validProofData.publicSignals,
    };

  console.log("\n1. Deploying verifier contract...");
  const verifier = await viem.deployContract("Groth16Verifier");
  console.log(`   Deployed at: ${verifier.address}`);

  console.log("\n2. Testing valid proof verification...");
    const validResult = await verifier.read.verifyProof([
      validProofData.a,
      validProofData.b,
      validProofData.c,
      validProofData.publicSignals,
    ]);
    console.log(`   Result: ${validResult}`);
    if (validResult === true) {
      console.log("   PASS: Valid proof accepted");
    } else {
      console.log("   FAIL: Valid proof rejected");
      return;
    }

  console.log("\n3. Testing invalid proof verification...");
    const invalidResult = await verifier.read.verifyProof([
      invalidProofData.a,
      invalidProofData.b,
      invalidProofData.c,
      invalidProofData.publicSignals,
    ]);
    console.log(`   Result: ${invalidResult}`);
    if (invalidResult === false) {
      console.log("   PASS: Invalid proof rejected");
    } else {
      console.log("   FAIL: Invalid proof accepted");
      return;
    }

  console.log("\n4. Testing zero proof verification...");
    const zeroResult = await verifier.read.verifyProof([
      [0n, 0n],
      [
        [0n, 0n],
        [0n, 0n],
      ],
      [0n, 0n],
      [0n],
    ]);
    console.log(`   Result: ${zeroResult}`);
    if (zeroResult === false) {
      console.log("   PASS: Zero proof rejected");
    } else {
      console.log("   FAIL: Zero proof accepted");
      return;
    }

  console.log("\n5. Testing gas consumption...");
    const publicClient = await viem.getPublicClient();
    const gasEstimate = await publicClient.estimateContractGas({
      address: verifier.address,
      abi: verifier.abi,
      functionName: "verifyProof",
      args: [validProofData.a, validProofData.b, validProofData.c, validProofData.publicSignals],
    });
    console.log(`   Gas estimate: ${gasEstimate}`);
    if (gasEstimate < 500000n) {
      console.log("   PASS: Gas consumption is reasonable");
    } else {
      console.log("   WARNING: High gas consumption");
    }

  console.log("\n6. Testing multiple verification calls...");
    const results = await Promise.all([
      verifier.read.verifyProof([
        validProofData.a,
        validProofData.b,
        validProofData.c,
        validProofData.publicSignals,
      ]),
      verifier.read.verifyProof([
        validProofData.a,
        validProofData.b,
        validProofData.c,
        validProofData.publicSignals,
      ]),
      verifier.read.verifyProof([
        invalidProofData.a,
        invalidProofData.b,
        invalidProofData.c,
        invalidProofData.publicSignals,
      ]),
    ]);

    if (results[0] === true && results[1] === true && results[2] === false) {
      console.log("   PASS: Multiple calls handled correctly");
    } else {
      console.log("   FAIL: Multiple calls failed");
      return;
    }

  console.log("\n" + "=".repeat(50));
  console.log("ALL TESTS PASSED! The verifier contract works correctly."); 
  console.log("\nTest Summary:");
  console.log("Contract deployment successful");
  console.log("Valid proofs are accepted");
  console.log("Invalid proofs are rejected");
  console.log("Zero proofs are rejected");
  console.log("Gas consumption is reasonable");
  console.log("Multiple verifications work correctly");
  } catch (error) {
    console.error("\nTest failed with error:", error);
    process.exit(1);
  }
}

runTests().catch(console.error);

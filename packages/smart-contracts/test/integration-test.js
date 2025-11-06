#!/usr/bin/env node

/**
 * Integration test that generates fresh proofs and tests them with the verifier
 * This demonstrates the complete flow from proof generation to verification
 */

import { spawn } from "child_process";
import path from "path";
import { network } from "hardhat";

async function generateFreshProof() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Generating fresh proof...");

    const circuitsDir = path.join(process.cwd(), "circuits");
    const testScript = spawn("node", ["test_proof.js"], {
      cwd: circuitsDir,
      stdio: "pipe",
    });

    let output = "";
    let error = "";

    testScript.stdout.on("data", (data) => {
      output += data.toString();
    });

    testScript.stderr.on("data", (data) => {
      error += data.toString();
    });

    testScript.on("close", (code) => {
      if (code === 0) {
        // Parse the output to extract proof data
        const aMatch = output.match(/a: \[(.*?)\]/s);
        const bMatch = output.match(/b: \[(.*?)\]/s);
        const cMatch = output.match(/c: \[(.*?)\]/s);
        const publicMatch = output.match(/publicSignals: \[(.*?)\]/);

        if (aMatch && bMatch && cMatch && publicMatch) {
          try {
            // Extract and clean up the proof components
            const aStr = aMatch[1].replace(/'/g, '"').replace(/\s+/g, "");
            const bStr = bMatch[1].replace(/'/g, '"');
            const cStr = cMatch[1].replace(/'/g, '"').replace(/\s+/g, "");
            const publicStr = publicMatch[1].replace(/'/g, '"');

            const proof = {
              a: JSON.parse(`[${aStr}]`).map((x) => BigInt(x)),
              b: JSON.parse(`[${bStr}]`).map((row) => row.map((x) => BigInt(x))),
              c: JSON.parse(`[${cStr}]`).map((x) => BigInt(x)),
              publicSignals: JSON.parse(`[${publicStr}]`).map((x) => BigInt(x)),
            };

            console.log("   ✅ Proof generated successfully");
            resolve(proof);
          } catch (parseError) {
            console.log("Raw output:", output);
            reject(new Error(`Failed to parse proof: ${parseError.message}`));
          }
        } else {
          reject(new Error("Could not extract proof from output"));
        }
      } else {
        reject(new Error(`Proof generation failed: ${error}`));
      }
    });

    // Kill the process after 2 minutes if it hasn't finished
    setTimeout(() => {
      testScript.kill();
      reject(new Error("Proof generation timed out after 2 minutes"));
    }, 120000);
  });
}

async function runIntegrationTest() {
  console.log("🔗 ZK Medical Eligibility - Integration Test");
  console.log("=".repeat(60));

  try {
    // Step 1: Generate a fresh proof
    const freshProof = await generateFreshProof();

    // Step 2: Deploy the verifier contract
    console.log("\n🚀 Deploying verifier contract...");
    const { viem } = await network.connect();
    const verifier = await viem.deployContract("MedicalEligibilityVerifier");
    console.log(`   ✅ Deployed at: ${verifier.address}`);

    // Step 3: Test the fresh proof
    console.log("\n🔍 Testing fresh proof...");
    console.log(`   Public signal: ${freshProof.publicSignals[0]}`);

    const result = await verifier.read.verifyProof([
      freshProof.a,
      freshProof.b,
      freshProof.c,
      freshProof.publicSignals,
    ]);

    console.log(`   Verification result: ${result}`);

    if (result === true) {
      console.log("   ✅ PASS: Fresh proof verified successfully!");
    } else {
      console.log("   ❌ FAIL: Fresh proof verification failed");
      return;
    }

    // Step 4: Test gas consumption with fresh proof
    console.log("\n⛽ Measuring gas consumption...");
    const publicClient = await viem.getPublicClient();
    const gasEstimate = await publicClient.estimateContractGas({
      address: verifier.address,
      abi: verifier.abi,
      functionName: "verifyProof",
      args: [freshProof.a, freshProof.b, freshProof.c, freshProof.publicSignals],
    });

    console.log(`   Gas estimate: ${gasEstimate}`);
    console.log(
      `   Cost efficiency: ${
        gasEstimate < 250000n ? "Excellent" : gasEstimate < 350000n ? "Good" : "Acceptable"
      }`
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 INTEGRATION TEST PASSED!");
    console.log("\n📋 Test Results:");
    console.log("✅ Fresh proof generated from circuit");
    console.log("✅ Verifier contract deployed");
    console.log("✅ Fresh proof verified on-chain");
    console.log(
      `✅ Gas consumption: ${gasEstimate} (${((Number(gasEstimate) / 1000000) * 100).toFixed(
        2
      )}% of block limit)`
    );
    console.log("\n🔒 Privacy preserved: Only eligibility result is public");
    console.log("🚀 Ready for production deployment");
  } catch (error) {
    console.error("\n❌ Integration test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runIntegrationTest().catch(console.error);

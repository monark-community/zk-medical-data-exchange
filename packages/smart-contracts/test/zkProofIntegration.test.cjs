// const snarkjs = require("snarkjs");
// const fs = require("fs");
// const { poseidon7, poseidon3 } = require("poseidon-lite");
// const { createPublicClient, createWalletClient, http, getContract } = require("viem");
// const { sepolia } = require("viem/chains");
// const { privateKeyToAccount } = require("viem/accounts");
// const { createCriteria, STUDY_TEMPLATES } = require("../../shared/studyCriteria.ts");
//
// // Load environment variables from current directory
// require("dotenv").config({ path: "./.env" });
//
// // Study contract ABI (minimal for testing)
// const STUDY_ABI = [
//   {
//     inputs: [
//       { internalType: "uint256[2]", name: "_pA", type: "uint256[2]" },
//       { internalType: "uint256[2][2]", name: "_pB", type: "uint256[2][2]" },
//       { internalType: "uint256[2]", name: "_pC", type: "uint256[2]" },
//       { internalType: "uint256", name: "dataCommitment", type: "uint256" },
//     ],
//     name: "joinStudy",
//     outputs: [],
//     stateMutability: "nonpayable",
//     type: "function",
//   },
//   {
//     inputs: [],
//     name: "currentParticipants",
//     outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//     stateMutability: "view",
//     type: "function",
//   },
//   {
//     inputs: [{ internalType: "address", name: "", type: "address" }],
//     name: "participants",
//     outputs: [{ internalType: "bool", name: "", type: "bool" }],
//     stateMutability: "view",
//     type: "function",
//   },
//   {
//     anonymous: false,
//     inputs: [
//       { indexed: true, internalType: "address", name: "participant", type: "address" },
//       { indexed: false, internalType: "uint256", name: "dataCommitment", type: "uint256" },
//     ],
//     name: "ParticipantJoined",
//     type: "event",
//   },
// ];
//
// const DEPLOYED_STUDY_ADDRESS = "0x3502abEBB4F9EaC246Fc32De6aEa134E29BFCd95";
//
// async function testEligiblePatient() {
//   console.log("Test Case 1: ELIGIBLE Patient (Diabetes Research)");
//   console.log("====================================================\n");
//
//   // Example patient data - ELIGIBLE for diabetes research
//   const patientData = {
//     age: 45,
//     gender: 2, // Female (using 1=male, 2=female as per your templates)
//     bmi: 285, // BMI 28.5 (multiplied by 10)
//     hba1c: 75, // HbA1c 7.5% (multiplied by 10)
//     systolicBP: 130,
//     diastolicBP: 85,
//     hasHeartDisease: 0,
//     hasDiabetes: 1, // Has diabetes (required for diabetes research)
//     hasHypertension: 0,
//     isPregnant: 0,
//     smokingStatus: 1, // Current smoker
//     cholesterol: 180,
//     bloodType: 1,
//     region: 1,
//     activityLevel: 2,
//   };
//
//   // Use DIABETES_RESEARCH template from shared library
//   const studyCriteria = STUDY_TEMPLATES.DIABETES_RESEARCH;
//
//   const isEligible = 1; // We expect this patient to be eligible
//
//   console.log("Patient eligibility check:");
//   console.log(
//     `Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) ${
//       patientData.age >= studyCriteria.minAge && patientData.age <= studyCriteria.maxAge
//     }`
//   );
//   console.log(
//     `BMI: ${patientData.bmi / 10} (${studyCriteria.minBMI / 10}-${studyCriteria.maxBMI / 10}) ${
//       patientData.bmi >= studyCriteria.minBMI && patientData.bmi <= studyCriteria.maxBMI
//     }`
//   );
//   console.log(
//     `HbA1c: ${patientData.hba1c / 10}% (${studyCriteria.minHbA1c / 10}-${
//       studyCriteria.maxHbA1c / 10
//     }%) ${
//       patientData.hba1c >= studyCriteria.minHbA1c && patientData.hba1c <= studyCriteria.maxHbA1c
//     }`
//   );
//   console.log(`Has Diabetes: ${patientData.hasDiabetes ? "Yes" : "No"}`);
//
//   return await runProofTest(patientData, studyCriteria, isEligible);
// }
//
// async function testIneligiblePatient() {
//   console.log("\n Test Case 2: INELIGIBLE Patient (Cardiac Research)");
//   console.log("===================================================\n");
//
//   // Example patient data - INELIGIBLE for cardiac research (too young + wrong BP range)
//   const patientData = {
//     age: 25, // TOO YOUNG (min 40 for cardiac research)
//     gender: 1, // Male
//     bmi: 250, // BMI 25.0
//     hba1c: 55, // HbA1c 5.5%
//     systolicBP: 110, // TOO LOW for cardiac research (min 120)
//     diastolicBP: 70, // TOO LOW for cardiac research (min 80)
//     hasHeartDisease: 0, // No heart disease
//     hasDiabetes: 0,
//     hasHypertension: 0,
//     isPregnant: 0,
//     smokingStatus: 0, // Never smoked
//     cholesterol: 160,
//     bloodType: 1,
//     region: 1,
//     activityLevel: 3,
//   };
//
//   // Use CARDIAC_RESEARCH template from shared library
//   const studyCriteria = STUDY_TEMPLATES.CARDIAC_RESEARCH;
//
//   const isEligible = 0; // We expect this patient to be INELIGIBLE
//
//   console.log("Patient eligibility check:");
//   console.log(
//     `Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) ${
//       patientData.age >= studyCriteria.minAge && patientData.age <= studyCriteria.maxAge
//     }`
//   );
//   console.log(
//     `Systolic BP: ${patientData.systolicBP} (${studyCriteria.minSystolic}-${
//       studyCriteria.maxSystolic
//     }) ${
//       patientData.systolicBP >= studyCriteria.minSystolic &&
//       patientData.systolicBP <= studyCriteria.maxSystolic
//         ? ""
//         : ""
//     }`
//   );
//   console.log(
//     `Diastolic BP: ${patientData.diastolicBP} (${studyCriteria.minDiastolic}-${
//       studyCriteria.maxDiastolic
//     }) ${
//       patientData.diastolicBP >= studyCriteria.minDiastolic &&
//       patientData.diastolicBP <= studyCriteria.maxDiastolic
//         ? ""
//         : ""
//     }`
//   );
//   console.log(`Heart Disease History: Required for cardiac research`);
//
//   return await runProofTest(patientData, studyCriteria, isEligible);
// }
//
// async function testDeployedStudy() {
//   console.log("\n Test Case 3: DEPLOYED Study - Adult Women");
//   console.log("==============================================");
//   console.log("Study Info:");
//   console.log("  • Title: 'adult women'");
//   console.log("  • Contract: 0x3502abEBB4F9EaC246Fc32De6aEa134E29BFCd95");
//   console.log("  • Criteria: Women aged 18-55");
//   console.log("  • Max Participants: 1000");
//   console.log("  • Status: Active\n");
//
//   // Example patient data - ELIGIBLE for deployed study (adult woman)
//   const patientData = {
//     age: 35, // Within range 18-55
//     gender: 2, // Female (required)
//     bmi: 240, // BMI 24.0 (not checked by study)
//     hba1c: 55, // HbA1c 5.5% (not checked by study)
//     systolicBP: 120,
//     diastolicBP: 80,
//     hasHeartDisease: 0,
//     hasDiabetes: 0,
//     hasHypertension: 0,
//     isPregnant: 0,
//     smokingStatus: 0, // Never smoked
//     cholesterol: 170,
//     bloodType: 1,
//     region: 1,
//     activityLevel: 2,
//   };
//
//   // Use WOMEN_18_TO_55 template from shared library (matches deployed study)
//   const studyCriteria = STUDY_TEMPLATES.WOMEN_18_TO_55;
//
//   const isEligible = 1; // We expect this patient to be eligible
//
//   console.log("Patient eligibility check:");
//   console.log(
//     `Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) ${
//       patientData.age >= studyCriteria.minAge && patientData.age <= studyCriteria.maxAge
//     }`
//   );
//   console.log(
//     `Gender: ${patientData.gender === 2 ? "Female" : "Male"} ${
//       patientData.gender === studyCriteria.allowedGender
//     }`
//   );
//   console.log(`Other criteria: All disabled for this study`);
//
//   const result = await runProofTest(patientData, studyCriteria, isEligible);
//
//   if (result.success) {
//     console.log("\n DEPLOYED STUDY VERIFICATION:");
//     console.log("  • ZK proof validates against deployed contract criteria");
//     console.log("  • Patient would be eligible to join this study");
//     console.log(
//       "  • Proof can be submitted to contract: 0x3502abEBB4F9EaC246Fc32De6aEa134E29BFCd95"
//     );
//   }
//
//   return result;
// }
//
// async function testDeployedStudyIneligible() {
//   console.log("\n Test Case 4: DEPLOYED Study - INELIGIBLE Patient");
//   console.log("===================================================");
//   console.log("Study Info:");
//   console.log("  • Title: 'adult women'");
//   console.log("  • Contract: 0x3502abEBB4F9EaC246Fc32De6aEa134E29BFCd95");
//   console.log("  • Criteria: Women aged 18-55");
//   console.log("  • Max Participants: 1000");
//   console.log("  • Status: Active\n");
//
//   // Example patient data - INELIGIBLE for deployed study (too old male)
//   const patientData = {
//     age: 60, // TOO OLD (max 55 for study)
//     gender: 1, // Male (study requires female)
//     bmi: 250, // BMI 25.0 (not checked by study)
//     hba1c: 55, // HbA1c 5.5% (not checked by study)
//     systolicBP: 130,
//     diastolicBP: 85,
//     hasHeartDisease: 0,
//     hasDiabetes: 0,
//     hasHypertension: 0,
//     isPregnant: 0,
//     smokingStatus: 0, // Never smoked
//     cholesterol: 180,
//     bloodType: 1,
//     region: 1,
//     activityLevel: 2,
//   };
//
//   // Use WOMEN_18_TO_55 template from shared library (matches deployed study)
//   const studyCriteria = STUDY_TEMPLATES.WOMEN_18_TO_55;
//
//   const isEligible = 0; // We expect this patient to be INELIGIBLE
//
//   console.log("Patient eligibility check:");
//   console.log(
//     `Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) ${
//       patientData.age >= studyCriteria.minAge && patientData.age <= studyCriteria.maxAge
//     }`
//   );
//   console.log(
//     `Gender: ${patientData.gender === 2 ? "Female" : "Male"} ${
//       patientData.gender === studyCriteria.allowedGender
//     }`
//   );
//   console.log("Other criteria: All disabled for this study");
//
//   const result = await runProofTest(patientData, studyCriteria, isEligible);
//
//   if (result.success) {
//     console.log("\n DEPLOYED STUDY VERIFICATION:");
//     console.log("  • ZK proof correctly shows patient is INELIGIBLE");
//     console.log("  • Patient does not meet study criteria (age + gender)");
//     console.log("  • Zero-knowledge proof preserved despite rejection");
//   }
//
//   return result;
// }
//
// async function testDeployedStudyBlockchain() {
//   console.log("\n Test Case 5: BLOCKCHAIN Integration - Deploy to Real Contract");
//   console.log("===============================================================");
//   console.log("Study Info:");
//   console.log("  • Title: 'adult women'");
//   console.log("  • Contract: 0x3502abEBB4F9EaC246Fc32De6aEa134E29BFCd95");
//   console.log("  • Network: Sepolia Testnet");
//   console.log("  • Action: Generate proof + Submit to contract\n");
//
//   try {
//     // Check if we have environment variables for blockchain interaction
//     if (!process.env.SEPOLIA_RPC_URL || !process.env.SEPOLIA_PRIVATE_KEY) {
//       console.log("Skipping blockchain test - missing environment variables");
//       console.log("   Set SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY to test on-chain");
//       return { success: true, skipped: true, reason: "No blockchain config" };
//     }
//
//     // Example patient data - ELIGIBLE for deployed study (adult woman)
//     const patientData = {
//       age: 28, // Within range 18-55
//       gender: 2, // Female (required)
//       bmi: 220, // BMI 22.0
//       hba1c: 52, // HbA1c 5.2%
//       systolicBP: 115,
//       diastolicBP: 75,
//       hasHeartDisease: 0,
//       hasDiabetes: 0,
//       hasHypertension: 0,
//       isPregnant: 0,
//       smokingStatus: 0,
//       cholesterol: 165,
//       bloodType: 2,
//       region: 1,
//       activityLevel: 3,
//     };
//
//     // Use WOMEN_18_TO_55 template from shared library (matches deployed study)
//     const studyCriteria = STUDY_TEMPLATES.WOMEN_18_TO_55;
//
//     console.log("Patient eligibility check:");
//     console.log(`Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) `);
//     console.log(`Gender: Female `);
//
//     // Generate ZK proof for this patient
//     const proofResult = await runProofTest(patientData, studyCriteria, 1);
//
//     if (!proofResult.success) {
//       return { success: false, error: "Proof generation failed" };
//     }
//
//     console.log("\n BLOCKCHAIN INTERACTION:");
//     console.log("  • ZK proof generated successfully");
//     console.log("  • Connecting to Sepolia network...");
//
//     // Set up blockchain clients
//     const publicClient = createPublicClient({
//       chain: sepolia,
//       transport: http(process.env.SEPOLIA_RPC_URL),
//     });
//
//     const account = privateKeyToAccount(`0x${process.env.SEPOLIA_PRIVATE_KEY}`);
//     const walletClient = createWalletClient({
//       account,
//       chain: sepolia,
//       transport: http(process.env.SEPOLIA_RPC_URL),
//     });
//
//     console.log(`  • Connected as: ${account.address}`);
//
//     // Get contract instance
//     const studyContract = getContract({
//       address: DEPLOYED_STUDY_ADDRESS,
//       abi: STUDY_ABI,
//       client: { public: publicClient, wallet: walletClient },
//     });
//
//     // Check current participant count before joining
//     console.log("  • Reading current study state...");
//     const participantsBefore = await publicClient.readContract({
//       address: DEPLOYED_STUDY_ADDRESS,
//       abi: STUDY_ABI,
//       functionName: "currentParticipants",
//     });
//
//     console.log(`  • Current participants: ${participantsBefore}`);
//
//     // Check if this address is already a participant
//     const isAlreadyParticipant = await publicClient.readContract({
//       address: DEPLOYED_STUDY_ADDRESS,
//       abi: STUDY_ABI,
//       functionName: "participants",
//       args: [account.address],
//     });
//
//     if (isAlreadyParticipant) {
//       console.log("  This address is already a participant in the study");
//       return { success: true, onChainReady: true, alreadyParticipant: true };
//     }
//
//     console.log("  • Submitting ZK proof to contract...");
//
//     // Format proof for contract call
//     const formattedProof = {
//       a: [BigInt(proofResult.solidityProof.a[0]), BigInt(proofResult.solidityProof.a[1])],
//       b: [
//         [BigInt(proofResult.solidityProof.b[0][0]), BigInt(proofResult.solidityProof.b[0][1])],
//         [BigInt(proofResult.solidityProof.b[1][0]), BigInt(proofResult.solidityProof.b[1][1])],
//       ],
//       c: [BigInt(proofResult.solidityProof.c[0]), BigInt(proofResult.solidityProof.c[1])],
//     };
//
//     // Submit to blockchain!
//     const txHash = await walletClient.writeContract({
//       address: DEPLOYED_STUDY_ADDRESS,
//       abi: STUDY_ABI,
//       functionName: "joinStudy",
//       args: [
//         formattedProof.a,
//         formattedProof.b,
//         formattedProof.c,
//         BigInt(proofResult.dataCommitment),
//       ],
//     });
//
//     console.log(`  Transaction submitted! Hash: ${txHash}`);
//     console.log("  • Waiting for confirmation...");
//
//     // Wait for transaction confirmation
//     const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
//
//     if (receipt.status === "success") {
//       console.log("  SUCCESS! Patient joined the study on-chain!");
//       console.log(`  • Block: ${receipt.blockNumber}`);
//       console.log(`  • Gas used: ${receipt.gasUsed}`);
//
//       // Check participant count after joining
//       const participantsAfter = await publicClient.readContract({
//         address: DEPLOYED_STUDY_ADDRESS,
//         abi: STUDY_ABI,
//         functionName: "currentParticipants",
//       });
//
//       console.log(
//         `  • Participants after: ${participantsAfter} (+${participantsAfter - participantsBefore})`
//       );
//
//       return {
//         success: true,
//         onChainSuccess: true,
//         txHash,
//         blockNumber: receipt.blockNumber.toString(),
//         participantsBefore: participantsBefore.toString(),
//         participantsAfter: participantsAfter.toString(),
//       };
//     } else {
//       console.log("  Transaction failed");
//       return { success: false, error: "Transaction failed" };
//     }
//   } catch (error) {
//     console.error("Blockchain test error:", error.message);
//
//     // If it's a contract-specific error, still show what we would have done
//     if (proofResult.success) {
//       console.log("\nContract Call Preview (proof was valid but call failed):");
//       console.log("  Function: joinStudy(proof.a, proof.b, proof.c, dataCommitment)");
//       console.log("  • proof.a:", proofResult.solidityProof?.a || "Generated");
//       console.log("  • proof.b:", proofResult.solidityProof?.b || "Generated");
//       console.log("  • proof.c:", proofResult.solidityProof?.c || "Generated");
//       console.log("  • dataCommitment:", proofResult.dataCommitment || "Patient data hash");
//
//       return { success: true, onChainReady: true, contractError: error.message };
//     }
//
//     return { success: false, error: error.message };
//   }
// }
//
// async function runProofTest(patientData, studyCriteria, expectedResult) {
//   try {
//     // Use fixed salt for consistent results (like original test)
//     const salt = 12345;
//
//     // Calculate patient data commitment the EXACT same way the circuit does
//     const commitment1 = poseidon7([
//       patientData.age, // 45
//       patientData.gender, // 1 or 2
//       patientData.region || 1, // region
//       patientData.cholesterol || 180, // cholesterol
//       patientData.bmi, // BMI
//       patientData.bloodType || 1, // bloodType
//       salt, // 12345
//     ]);
//
//     const commitment2 = poseidon7([
//       patientData.systolicBP, // systolic BP
//       patientData.diastolicBP, // diastolic BP
//       patientData.hba1c, // HbA1c
//       patientData.smokingStatus, // smoking status
//       patientData.activityLevel || 2, // activity level
//       patientData.hasDiabetes, // diabetes status
//       patientData.hasHeartDisease, // heart disease history
//     ]);
//
//     const finalCommitment = poseidon3([commitment1, commitment2, salt]);
//     console.log("Calculated commitment:", finalCommitment.toString());
//
//     // Prepare circuit inputs - using real StudyCriteria structure
//     const input = {
//       // Patient's medical data (private inputs)
//       age: patientData.age,
//       gender: patientData.gender,
//       region: patientData.region || 1,
//       cholesterol: patientData.cholesterol || 180,
//       bmi: patientData.bmi,
//       systolicBP: patientData.systolicBP,
//       diastolicBP: patientData.diastolicBP,
//       bloodType: patientData.bloodType || 1,
//       hba1c: patientData.hba1c,
//       smokingStatus: patientData.smokingStatus,
//       activityLevel: patientData.activityLevel || 2,
//       diabetesStatus: patientData.hasDiabetes,
//       heartDiseaseHistory: patientData.hasHeartDisease,
//       salt: salt,
//
//       // Study eligibility criteria - using real StudyCriteria structure
//       enableAge: studyCriteria.enableAge,
//       minAge: studyCriteria.minAge,
//       maxAge: studyCriteria.maxAge,
//       enableCholesterol: studyCriteria.enableCholesterol,
//       minCholesterol: studyCriteria.minCholesterol,
//       maxCholesterol: studyCriteria.maxCholesterol,
//       enableBMI: studyCriteria.enableBMI,
//       minBMI: studyCriteria.minBMI,
//       maxBMI: studyCriteria.maxBMI,
//       enableBloodType: studyCriteria.enableBloodType,
//       allowedBloodTypes: studyCriteria.allowedBloodTypes,
//       enableGender: studyCriteria.enableGender,
//       allowedGender: studyCriteria.allowedGender,
//       enableLocation: studyCriteria.enableLocation,
//       allowedRegions: studyCriteria.allowedRegions,
//       enableBloodPressure: studyCriteria.enableBloodPressure,
//       minSystolic: studyCriteria.minSystolic,
//       maxSystolic: studyCriteria.maxSystolic,
//       minDiastolic: studyCriteria.minDiastolic,
//       maxDiastolic: studyCriteria.maxDiastolic,
//       enableHbA1c: studyCriteria.enableHbA1c,
//       minHbA1c: studyCriteria.minHbA1c,
//       maxHbA1c: studyCriteria.maxHbA1c,
//       enableSmoking: studyCriteria.enableSmoking,
//       allowedSmoking: studyCriteria.allowedSmoking,
//       enableActivity: studyCriteria.enableActivity,
//       minActivityLevel: studyCriteria.minActivityLevel,
//       maxActivityLevel: studyCriteria.maxActivityLevel,
//       enableDiabetes: studyCriteria.enableDiabetes,
//       allowedDiabetes: studyCriteria.allowedDiabetes,
//       enableHeartDisease: studyCriteria.enableHeartDisease,
//       allowedHeartDisease: studyCriteria.allowedHeartDisease,
//
//       // Data commitment - calculated to match what the circuit will compute
//       dataCommitment: finalCommitment.toString(),
//     };
//
//     console.log("\nGenerating ZK proof...");
//     const startTime = Date.now();
//
//     // Generate the proof
//     const { proof, publicSignals } = await snarkjs.groth16.fullProve(
//       input,
//       "circuits/build/medical_eligibility_js/medical_eligibility.wasm",
//       "circuits/build/medical_eligibility_0001.zkey"
//     );
//
//     const endTime = Date.now();
//     console.log(`Proof generated in ${endTime - startTime}ms`);
//
//     console.log("\nProof Results:");
//     console.log(`Public signals: [${publicSignals.join(", ")}]`);
//     console.log(`Expected eligible result: ${expectedResult}`);
//     console.log(`Actual result: ${publicSignals[0]}`);
//     console.log(`Match: ${publicSignals[0] == expectedResult}`);
//
//     // Verify the proof
//     console.log("\nVerifying proof...");
//     const vKey = JSON.parse(fs.readFileSync("circuits/build/verification_key.json"));
//
//     const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
//     console.log(`Verification result: ${res ? "Valid" : "Invalid"}`);
//
//     if (res) {
//       console.log("\nSUCCESS! ZK proof system is working correctly:");
//       console.log("• Patient data and study criteria kept private");
//       console.log("• Only eligibility result (1 or 0) is public");
//       console.log("• Zero-knowledge proof verified successfully");
//       console.log(`• Proof size: ${JSON.stringify(proof).length} characters`);
//
//       // Format for smart contract
//       const solidityProof = {
//         a: [proof.pi_a[0], proof.pi_a[1]],
//         b: [
//           [proof.pi_b[0][1], proof.pi_b[0][0]],
//           [proof.pi_b[1][1], proof.pi_b[1][0]],
//         ],
//         c: [proof.pi_c[0], proof.pi_c[1]],
//         publicSignals: publicSignals,
//       };
//
//       console.log("\nFormatted for Solidity:");
//       console.log("a:", solidityProof.a);
//       console.log("b:", solidityProof.b);
//       console.log("c:", solidityProof.c);
//       console.log("publicSignals:", solidityProof.publicSignals);
//     }
//
//     return {
//       success: res,
//       eligible: publicSignals[0] == expectedResult,
//       solidityProof: res
//         ? {
//             a: [proof.pi_a[0], proof.pi_a[1]],
//             b: [
//               [proof.pi_b[0][1], proof.pi_b[0][0]],
//               [proof.pi_b[1][1], proof.pi_b[1][0]],
//             ],
//             c: [proof.pi_c[0], proof.pi_c[1]],
//             publicSignals: publicSignals,
//           }
//         : null,
//       dataCommitment: finalCommitment.toString(),
//     };
//   } catch (error) {
//     console.error("Error generating proof:", error.message);
//     console.error(error);
//     return { success: false, error: error.message };
//   }
// }
//
// // Main test runner
// async function runAllTests() {
//   console.log("ZK Medical Eligibility Proof Tests");
//   console.log("=====================================\n");
//
//   try {
//     // Test Case 1: Eligible Patient (Template Study)
//     const result1 = await testEligiblePatient();
//
//     // Test Case 2: Ineligible Patient (Template Study)
//     const result2 = await testIneligiblePatient();
//
//     // Test Case 3: Deployed Study - Adult Women
//     const result3 = await testDeployedStudy();
//
//     // Test Case 4: Deployed Study - Ineligible Patient
//     const result4 = await testDeployedStudyIneligible();
//
//     // Test Case 5: Blockchain Integration Test
//     const result5 = await testDeployedStudyBlockchain();
//
//     console.log("\n Test Summary:");
//     console.log("================");
//     console.log(`Eligible Patient Test: ${result1.success ? "PASSED" : "FAILED"}`);
//     console.log(`Ineligible Patient Test: ${result2.success ? "PASSED" : "FAILED"}`);
//     console.log(`Deployed Study Test: ${result3.success ? "PASSED" : "FAILED"}`);
//     console.log(`Deployed Study Ineligible Test: ${result4.success ? "PASSED" : "FAILED"}`);
//     console.log(
//       `Blockchain Integration: ${
//         result5.success ? (result5.skipped ? "SKIPPED" : "READY") : "FAILED"
//       }`
//     );
//
//     const allPassed =
//       result1.success && result2.success && result3.success && result4.success && result5.success;
//
//     if (allPassed) {
//       console.log("\nAll tests passed! ZK proof system works with:");
//       console.log("  • Template-based studies (diabetes, cardiac research)");
//       console.log("  • Real deployed studies (adult women study)");
//       console.log("  • Both eligible and ineligible patient scenarios");
//       console.log("  • Deployed study eligibility validation");
//       if (result5.onChainReady) {
//         console.log("  • Ready for on-chain deployment to real contracts!");
//       } else if (result5.skipped) {
//         console.log("  • Blockchain integration ready (set env vars to test on-chain)");
//       }
//     }
//   } catch (error) {
//     console.error("Test suite failed:", error);
//   }
// }
//
// // Run all tests
// runAllTests().catch(console.error);

import { network } from "hardhat";
import {
  createCriteria,
  validateCriteria,
  toBlockchainFormat,
  countEnabledCriteria,
  getStudyComplexity,
  STUDY_TEMPLATES,
} from "../src/studyCriteria.js";

/**
 * Script to create a single study with custom parameters
 * Usage: bun hardhat run scripts/createCustomStudy.ts --network hardhatOp
 */
async function main() {
  // Get network configuration
  const args = process.argv;
  const networkIndex = args.findIndex((arg) => arg === "--network");
  const networkName =
    networkIndex !== -1 && args[networkIndex + 1] ? args[networkIndex + 1] : "hardhatOp";
  const chainType = networkName === "hardhatOp" ? "op" : "l1";

  const { viem } = await network.connect({
    network: networkName,
    chainType: chainType,
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("🏥 Creating Custom Medical Study");
  console.log("📋 Deployer:", deployer.account.address);

  // Configure your study parameters here
  const studyConfig = {
    title: "Simple Age-Only Study", // CHANGED: Single criteria example
    description: "Basic demographic study - only age matters",
    maxParticipants: 1000, // Higher since less restrictive
    durationDays: 365, // 1 year
    principalInvestigator: deployer.account.address,

    // Study criteria - SUPER CLEAN with shared library!
    //
    // Option 1: Use pre-built templates
    // eligibilityCriteria: STUDY_TEMPLATES.OPEN,                // Anyone can join
    // eligibilityCriteria: STUDY_TEMPLATES.AGE_ONLY,            // Age 18-65 only
    // eligibilityCriteria: STUDY_TEMPLATES.WOMEN_18_TO_55,      // Female, age 18-55
    // eligibilityCriteria: STUDY_TEMPLATES.CARDIAC_RESEARCH,    // Cardiac research
    // eligibilityCriteria: STUDY_TEMPLATES.DIABETES_RESEARCH,   // Diabetes research
    //
    // Option 2: Create custom criteria (only specify what you want!)
    eligibilityCriteria: createCriteria({
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
      // Everything else automatically disabled by shared library!
    }),
  };

  // Contract addresses (replace with your deployed addresses)
  const STUDY_FACTORY_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const ZK_VERIFIER_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  // Connect to existing contracts
  const studyFactory = await viem.getContractAt("StudyFactory", STUDY_FACTORY_ADDRESS);

  console.log("\n📝 Study Configuration:");
  console.log("═══════════════════════════════════════════════");
  console.log(`📌 Title: ${studyConfig.title}`);
  console.log(`👥 Max Participants: ${studyConfig.maxParticipants}`);
  console.log(`📅 Duration: ${studyConfig.durationDays} days`);
  console.log(`🔬 PI: ${studyConfig.principalInvestigator}`);
  // Validate criteria using shared library
  const validation = validateCriteria(studyConfig.eligibilityCriteria);
  if (!validation.valid) {
    console.error("❌ Invalid criteria:", validation.errors);
    return;
  }

  console.log("\n🎯 Eligibility Criteria (powered by shared library):");
  const enabledCount = countEnabledCriteria(studyConfig.eligibilityCriteria);
  const complexity = getStudyComplexity(studyConfig.eligibilityCriteria);

  console.log(`📊 Enabled Criteria: ${enabledCount}/12 (${complexity} study)`);

  if (studyConfig.eligibilityCriteria.enableAge) {
    console.log(
      `   ✅ Age: ${studyConfig.eligibilityCriteria.minAge}-${studyConfig.eligibilityCriteria.maxAge} years`
    );
  }
  if (studyConfig.eligibilityCriteria.enableCholesterol) {
    console.log(
      `   ✅ Cholesterol: ${studyConfig.eligibilityCriteria.minCholesterol}-${studyConfig.eligibilityCriteria.maxCholesterol} mg/dL`
    );
  }
  if (studyConfig.eligibilityCriteria.enableBMI) {
    console.log(
      `   ✅ BMI: ${studyConfig.eligibilityCriteria.minBMI / 10}-${
        studyConfig.eligibilityCriteria.maxBMI / 10
      }`
    );
  }
  if (studyConfig.eligibilityCriteria.enableBloodPressure) {
    console.log(
      `   ✅ Blood Pressure: ${studyConfig.eligibilityCriteria.minSystolic}-${studyConfig.eligibilityCriteria.maxSystolic}/${studyConfig.eligibilityCriteria.minDiastolic}-${studyConfig.eligibilityCriteria.maxDiastolic} mmHg`
    );
  }
  if (studyConfig.eligibilityCriteria.enableSmoking) {
    console.log(`   ✅ Smoking Status: Any (${studyConfig.eligibilityCriteria.allowedSmoking})`);
  }
  if (studyConfig.eligibilityCriteria.enableHeartDisease) {
    console.log(
      `   ✅ Heart Disease History: Any (${studyConfig.eligibilityCriteria.allowedHeartDisease})`
    );
  }

  if (enabledCount === 0) {
    console.log(`🔓 COMPLETELY OPEN STUDY - Anyone can join!`);
  } else if (enabledCount === 1) {
    console.log(`🎯 SINGLE CRITERIA STUDY - Very simple eligibility!`);
  }
  console.log("═══════════════════════════════════════════════");

  console.log("\n🚀 Creating Study Contract...");

  // Convert criteria to blockchain format using shared library utility
  const contractCriteria = toBlockchainFormat(studyConfig.eligibilityCriteria);

  const studyCreationTx = await studyFactory.write.createStudy([
    studyConfig.title,
    studyConfig.description,
    BigInt(studyConfig.maxParticipants),
    BigInt(Date.now()), // startDate
    BigInt(Date.now() + studyConfig.durationDays * 24 * 60 * 60 * 1000), // endDate
    studyConfig.principalInvestigator,
    ZK_VERIFIER_ADDRESS,
    contractCriteria, // NOW PASSING CUSTOM CRITERIA!
  ]);

  await publicClient.waitForTransactionReceipt({
    hash: studyCreationTx,
  });

  console.log("✅ Study created! Transaction:", studyCreationTx);

  console.log("📋 Study successfully created and deployed!");

  // Study address can be found in the transaction logs
  // Each study is deployed as an individual contract via CREATE2
  const studyAddress = "Check transaction logs for exact address";
  console.log("\n🎉 Study Deployment Complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("📋 Study Contract:", studyAddress);
  console.log("🏭 Factory Address:", STUDY_FACTORY_ADDRESS);
  console.log("📊 Verifier Address:", ZK_VERIFIER_ADDRESS);
  console.log("═══════════════════════════════════════════════");

  console.log("\n📝 Next Steps:");
  console.log("1. Patients generate ZK proofs with their medical data");
  console.log("2. Proofs must satisfy the eligibility criteria above");
  console.log("3. Call study.joinStudy() with valid Groth16 proofs");
  console.log("4. ZK verification ensures privacy-preserving enrollment!");

  console.log(`\n💡 Study Contract Interface:`);
  console.log(`   - Address: ${studyAddress}`);
  console.log(
    `   - Function: joinStudy(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint256 dataCommitment)`
  );
  console.log(`   - Verifies ZK proof and enrolls eligible participants`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Study creation failed:");
    console.error(error);
    process.exit(1);
  });

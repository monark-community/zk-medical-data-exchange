import { network } from "hardhat";

/**
 * Deploy script for the complete ZK medical study system
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

  console.log("🚀 Deploying ZK Medical Study System");
  console.log("📋 Deployer:", deployer.account.address);

  // Step 1: Deploy the auto-generated ZK verifier
  console.log("\n1️⃣ Deploying Groth16 Verifier Contract...");
  const verifierContract = await viem.deployContract("Groth16Verifier");
  console.log("✅ Verifier deployed to:", verifierContract.address);

  // Step 2: Deploy StudyFactory
  console.log("\n2️⃣ Deploying Study Factory...");
  const studyFactory = await viem.deployContract("StudyFactory", [true]); // Allow open creation for demo
  console.log("✅ StudyFactory deployed to:", studyFactory.address);

  // Step 3: Create custom studies with specific ZK verification criteria
  console.log("\n3️⃣ Creating Custom Medical Studies...");

  // Study 1: Cardiovascular Research Study
  console.log("\n📋 Creating Cardiovascular Research Study...");
  const cardioStudyTx = await studyFactory.write.createStudy([
    "Cardiovascular Risk Assessment Study", // title
    "Research on cardiovascular disease prevention", // description (not used)
    BigInt(50), // maxParticipants
    BigInt(Date.now()), // startDate (not used)
    BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000), // endDate (not used)
    deployer.account.address, // principalInvestigator
    verifierContract.address, // zkVerifierAddress
    {
      // Custom criteria for cardiovascular research
      minAge: BigInt(40),
      maxAge: BigInt(75),
      minCholesterol: BigInt(160),
      maxCholesterol: BigInt(300),
      minBMI: BigInt(200), // BMI 20.0
      maxBMI: BigInt(350), // BMI 35.0
      allowedBloodTypes: [BigInt(1), BigInt(2), BigInt(3), BigInt(4)], // A+, A-, B+, B-
    },
  ]);

  await publicClient.waitForTransactionReceipt({
    hash: cardioStudyTx,
  });

  // Study 2: Diabetes Prevention Study
  console.log("\n📋 Creating Diabetes Prevention Study...");
  const diabetesStudyTx = await studyFactory.write.createStudy([
    "Type 2 Diabetes Prevention Trial", // title
    "Preventive interventions for pre-diabetic patients", // description (not used)
    BigInt(75), // maxParticipants
    BigInt(Date.now()), // startDate (not used)
    BigInt(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // endDate (not used)
    deployer.account.address, // principalInvestigator
    verifierContract.address, // zkVerifierAddress
    {
      // Custom criteria for diabetes prevention
      minAge: BigInt(25),
      maxAge: BigInt(65),
      minCholesterol: BigInt(120),
      maxCholesterol: BigInt(250),
      minBMI: BigInt(250), // BMI 25.0 (pre-diabetic range)
      maxBMI: BigInt(400), // BMI 40.0
      allowedBloodTypes: [BigInt(1), BigInt(2), BigInt(7), BigInt(8)], // A+, A-, O+, O-
    },
  ]);

  await publicClient.waitForTransactionReceipt({
    hash: diabetesStudyTx,
  });

  // Study 3: General Health Screening Study
  console.log("\n📋 Creating General Health Screening Study...");
  const generalStudyTx = await studyFactory.write.createStudy([
    "Population Health Screening Study", // title
    "Broad population health assessment", // description (not used)
    BigInt(200), // maxParticipants
    BigInt(Date.now()), // startDate (not used)
    BigInt(Date.now() + 180 * 24 * 60 * 60 * 1000), // endDate (not used)
    deployer.account.address, // principalInvestigator
    verifierContract.address, // zkVerifierAddress
    {
      // Custom criteria for general population screening
      minAge: BigInt(18),
      maxAge: BigInt(80),
      minCholesterol: BigInt(100),
      maxCholesterol: BigInt(350),
      minBMI: BigInt(150), // BMI 15.0
      maxBMI: BigInt(450), // BMI 45.0 (broad range)
      allowedBloodTypes: [BigInt(5), BigInt(6), BigInt(7), BigInt(8)], // AB+, AB-, O+, O-
    },
  ]);

  await publicClient.waitForTransactionReceipt({
    hash: generalStudyTx,
  });

  console.log("✅ All studies created successfully!");

  // Get all study addresses from events
  const allStudyEvents = await studyFactory.getEvents.StudyCreated();
  const recentStudies = allStudyEvents.slice(-3); // Get last 3 studies

  console.log("\n📋 Deployed Study Contracts:");
  recentStudies.forEach((event, index) => {
    const studyNames = [
      "Cardiovascular Research",
      "Diabetes Prevention",
      "General Health Screening",
    ];
    console.log(`${index + 1}. ${studyNames[index]}: ${event.args.studyContract}`);
  });

  // Step 4: Show deployment summary
  console.log("\n🎉 ZK Medical Study System Deployment Complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("📊 Verifier Address:", verifierContract.address);
  console.log("🏭 Factory Address:", studyFactory.address);
  console.log(`📋 Total Studies Created: ${recentStudies.length}`);
  console.log("═══════════════════════════════════════════════");

  console.log("\n📝 Next Steps:");
  console.log("1. Generate ZK proofs using the Circom circuit");
  console.log("2. Call study.joinStudy() with valid Groth16 proofs");
  console.log("3. Verify participants without revealing private data!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

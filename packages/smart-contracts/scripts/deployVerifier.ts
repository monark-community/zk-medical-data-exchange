import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying MedicalEligibilityVerifier to Sepolia testnet...");
  console.log("=".repeat(60));

  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  // Display deployment info
  console.log(`📋 Deployment Details:`);
  console.log(`   Network: Sepolia Testnet`);
  console.log(`   Chain ID: ${await publicClient.getChainId()}`);
  console.log(`   Deployer: ${deployer.account.address}`);

  // Check balance
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log(`   Balance: ${balanceEth.toFixed(4)} ETH`);

  if (balanceEth < 0.01) {
    console.log("⚠️  WARNING: Low balance! You may need more ETH for deployment.");
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
  }

  console.log("\n🔄 Deploying MedicalEligibilityVerifier (Groth16Verifier)...");
  console.log("   This verifier was generated from: circuits/build/medical_eligibility_0001.zkey");
  
  const verifierContract = await viem.deployContract("Groth16Verifier");
  
  console.log(`   ✅ Verifier deployed successfully!`);

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 VERIFIER DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("");
  console.log("📋 Contract Address:");
  console.log(`   MedicalEligibilityVerifier: ${verifierContract.address}`);
  console.log("");
  console.log("🔗 Verification Link:");
  console.log(`   https://sepolia.etherscan.io/address/${verifierContract.address}`);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Update your API .env file:");
  console.log(`      ZK_VERIFIER_ADDRESS=${verifierContract.address}`);
  console.log("");
  console.log("   2. Restart your API server:");
  console.log("      bun run dev:api");
  console.log("");
  console.log("   3. Create a NEW study from your frontend");
  console.log("      (It will use this new verifier automatically)");
  console.log("");
  console.log("   4. Apply to the new study - blockchain verification will work! 🎉");
  console.log("");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contract: {
      name: "MedicalEligibilityVerifier",
      address: verifierContract.address,
      generatedFrom: "circuits/build/medical_eligibility_0001.zkey",
    },
  };

  console.log("📄 Deployment JSON:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

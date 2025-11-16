import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying DataAggregationVerifier to Sepolia testnet...");
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

  console.log("\n🔄 Deploying DataAggregationVerifier...");
  const verifierContract = await viem.deployContract("contracts/studies/DataAggregationVerifier.sol:Groth16Verifier");
  console.log(`   ✅ DataAggregationVerifier deployed: ${verifierContract.address}`);

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("");
  console.log("📋 Contract Address:");
  console.log(`   DataAggregationVerifier: ${verifierContract.address}`);
  console.log("");
  console.log("🔗 Verification Link:");
  console.log(`   Verifier: https://sepolia.etherscan.io/address/${verifierContract.address}`);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Verify contract on Etherscan (optional)");
  console.log("   2. Update your app config with the new address");
  console.log("   3. Use this verifier for data aggregation proofs");
  console.log("");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      DataAggregationVerifier: verifierContract.address,
    },
  };

  console.log("📄 Deployment JSON:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

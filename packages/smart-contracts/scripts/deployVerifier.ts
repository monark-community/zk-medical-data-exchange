import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying MedicalEligibilityVerifier (Groth16Verifier) to Sepolia testnet...");
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
  const verifierContract = await viem.deployContract("contracts/studies/MedicalEligibilityVerifier.sol:Groth16Verifier");
  console.log(`   ✅ Verifier deployed: ${verifierContract.address}`);

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 VERIFIER DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Address:");
  console.log(`   MedicalEligibilityVerifier: ${verifierContract.address}`);
  console.log("\n🔗 Verification Link:");
  console.log(`   https://sepolia.etherscan.io/address/${verifierContract.address}`);
  console.log("\n⚠️  IMPORTANT: Update your .env file with:");
  console.log(`   ZK_VERIFIER_ADDRESS=${verifierContract.address}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

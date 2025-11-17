// scripts/deploy-disperse.ts
import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying Disperse to Sepolia testnet...");
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

  console.log("\n🔄 Step 1: Deploying Disperse...");
  const disperse = await viem.deployContract("Disperse");
  console.log(`   ✅ Disperse deployed: ${disperse.address}`);

  console.log("\n📊 Notes:");
  console.log("   • Disperse supports ETH + ERC20 (equal & variable amounts).");
  console.log("   • For ERC20, remember to approve the summed amount to the contract first.");

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log(`   Disperse: ${disperse.address}`);
  console.log("");
  console.log("🔗 Verification Links:");
  console.log(`   Disperse: https://sepolia.etherscan.io/address/${disperse.address}`);
  console.log("");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      Disperse: disperse.address,
    },
    notes: {
      description:
        "Batch sender for ETH and ERC20. For tokens, caller must approve total amount to this contract.",
    },
  };

  const outDir = path.join(process.cwd(), "deployments");
  const outFile = path.join(outDir, "deployment-sepolia-disperse.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to ${path.relative(process.cwd(), outFile)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

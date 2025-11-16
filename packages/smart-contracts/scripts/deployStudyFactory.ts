import { network } from "hardhat";

async function main() {
  console.log("Deploying StudyFactory to Sepolia testnet...");
  console.log("=".repeat(60));

  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  // Display deployment info
  console.log(`Deployment Details:`);
  console.log(`   Network: Sepolia Testnet`);
  console.log(`   Chain ID: ${await publicClient.getChainId()}`);
  console.log(`   Deployer: ${deployer.account.address}`);

  // Check balance
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log(`   Balance: ${balanceEth.toFixed(4)} ETH`);

  if (balanceEth < 0.01) {
    console.log("WARNING: Low balance! You may need more ETH for deployment.");
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
  }
  const verifierContract = await viem.deployContract("Groth16Verifier");
  const studyFactoryContract = await viem.deployContract("StudyFactory", [true]);

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      MedicalEligibilityVerifier: verifierContract.address,
      StudyFactory: studyFactoryContract.address,
    },
    gasEstimates: {
      deployment: "successful",
    },
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

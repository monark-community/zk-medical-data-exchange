import { network } from "hardhat";

async function main() {
  // Get network name from command line args or default
  const args = process.argv;
  const networkIndex = args.findIndex((arg) => arg === "--network");
  const networkName =
    networkIndex !== -1 && args[networkIndex + 1] ? args[networkIndex + 1] : "hardhatOp";
  const chainType = networkName === "hardhatOp" ? "op" : "l1";

  console.log(`Deploying to network: ${networkName}`);

  const { viem } = await network.connect({
    network: networkName,
    chainType: chainType,
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log(`Deployer address: ${deployer.account.address}`);
  console.log(`Chain ID: ${await publicClient.getChainId()}`);

  console.log("Deploying Counter contract...");
  const counterContract = await viem.deployContract("Counter");
  console.log("Counter deployed to:", counterContract.address);

  console.log("✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

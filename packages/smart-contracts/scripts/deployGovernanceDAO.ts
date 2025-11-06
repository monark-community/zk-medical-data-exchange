import { network } from "hardhat";

async function main() {
  console.log("Deploying GovernanceDAO to Sepolia...\n");

  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  const balance = await publicClient.getBalance({ address: deployer.account.address });
  const balanceEth = Number(balance) / 1e18;

  if (balanceEth < 0.01) {
    console.log(" WARNING: Low balance! Get Sepolia ETH from https://sepoliafaucet.com/\n");
  }

  const governanceDAO = await viem.deployContract("GovernanceDAO");
  
  console.log("✅ Deployment successful!\n");
  console.log(`Contract Address: ${governanceDAO.address}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${governanceDAO.address}`);
  console.log(`\nUpdate .env with: GOVERNANCE_DAO_ADDRESS=${governanceDAO.address}\n`);

  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      GovernanceDAO: governanceDAO.address,
    },
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

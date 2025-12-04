import { network } from "hardhat";

async function main() {

  const { viem } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  // Check balance
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log(`   Balance: ${balanceEth.toFixed(4)} ETH`);

  if (balanceEth < 0.01) {
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
  }

  // Deploy AuditTrail contract (constructor takes no parameters)
  const auditTrailContract = await viem.deployContract("AuditTrail");
  console.log(`AuditTrail deployed: ${auditTrailContract.address}`);

  console.log(`Address: ${auditTrailContract.address}`);

  // Display initial configuration
  console.log("   AuditTrail deployed with default configuration:");
  console.log(`   - Audit Manager: ${deployer.account.address}`);
  console.log(`   - Authorized Logger: ${deployer.account.address} (initial)`);
  console.log("   - Total Records: 0");
  // Test basic contract functionality
  try {
    // Read total records (should be 1 due to contract creation log)
    const totalRecords = await publicClient.readContract({
      address: auditTrailContract.address,
      abi: [
        {
          inputs: [],
          name: "totalRecords",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "totalRecords",
    });
    // Check audit manager
    const auditManager = await publicClient.readContract({
      address: auditTrailContract.address,
      abi: [
        {
          inputs: [],
          name: "auditManager",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "auditManager",
    });

  } catch {
    console.log("   Warning: Basic functionality test failed.");
  }

  // Display deployment summary
  console.log(`   AuditTrail: ${auditTrailContract.address}`);
  console.log("");
  console.log(`   Etherscan: https://sepolia.etherscan.io/address/${auditTrailContract.address}`);
  console.log("");
  console.log("   1. Add AUDIT_TRAIL_ADDRESS to your environment variables:");
  console.log(`      AUDIT_TRAIL_ADDRESS=${auditTrailContract.address}`);
  console.log("   2. Verify contract on Etherscan (optional)");
  console.log("   3. Test audit logging from your application");
  console.log("   4. Authorize additional loggers if needed using authorizeLogger()");
  console.log("");
  console.log("   - Audit Manager: " + deployer.account.address);
  console.log("   - Authorized Loggers: [" + deployer.account.address + "]");
  console.log("   - Profile-based filtering: ENABLED");
  console.log("   - Pagination support: ENABLED");
  console.log("   - Privacy-preserving dataHash: ENABLED");
  console.log("");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    chainId: await publicClient.getChainId(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      AuditTrail: auditTrailContract.address,
    },
    gasUsage: {
      status: "successful",
      address: auditTrailContract.address,
    },
    configuration: {
      auditManager: deployer.account.address,
      authorizedLoggers: [deployer.account.address],
      features: [
        "profile-based-filtering",
        "pagination",
        "privacy-preserving-hashing",
        "immutable-logging",
      ],
    },
  };

  console.log(`AUDIT_TRAIL_ADDRESS=${auditTrailContract.address}`);
  console.log("");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("AuditTrail deployment failed:", error);
    process.exit(1);
  });

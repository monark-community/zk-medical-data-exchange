// Tests a deployed contract on Sepolia
// go uncomment "resolveJsonModule": true, in tsconfig.json to run this script


import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  console.log("Testing GovernanceDAO...\n");

  const contractAddress = "0xab5a10bcc3df44865c54c2b646ba67da3c88e5c4";

  if (!process.env.SEPOLIA_RPC_URL || !process.env.SEPOLIA_PRIVATE_KEY) {
    throw new Error("Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env file");
  }

  console.log("Private key loaded:", process.env.SEPOLIA_PRIVATE_KEY.substring(0, 10) + "...");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  console.log("📋 Tester address:", signer.address);

  const artifactPath = path.join(__dirname, '../artifacts/contracts/governance/GovernanceDAO.sol/GovernanceDAO.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const governance = new ethers.Contract(
    contractAddress,
    artifact.abi,
    signer
  );

  console.log("\n Checking voting period...");
  const votingPeriod = await governance.votingPeriod();
  console.log(`   Voting period: ${votingPeriod} blocks`);

  console.log("\n Creating a test proposal...");
  const tx = await governance.createProposal(
    "Test Proposal",
    "This is a test proposal to verify the governance system works",
    0
  );
  await tx.wait();
  console.log(" Proposal created!");

  console.log("\nChecking proposal count...");
  const proposalCount = await governance.proposalCount();
  console.log(`   Total proposals: ${proposalCount}`);

  if (proposalCount > 0n) {
    console.log("\n Getting proposal details...");
    const proposal = await governance.proposals(0);
    console.log(`   ID: ${proposal.id}`);
    console.log(`   Title: ${proposal.title}`);
    console.log(`   Description: ${proposal.description}`);
    console.log(`   Proposer: ${proposal.proposer}`);
    console.log(`   State: ${["Active", "Passed", "Failed"][proposal.state]}`);
  }

  console.log("\n All tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Tests the deployed GovernanceFactory on Sepolia
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
  console.log("Testing GovernanceFactory...\n");

  // Use the newly deployed factory address
  const factoryAddress = "0xb5117e754f22c28ccf0b322e0184b203765c053d";

  if (!process.env.SEPOLIA_RPC_URL || !process.env.SEPOLIA_PRIVATE_KEY) {
    throw new Error("Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env file");
  }

  console.log("Private key loaded:", process.env.SEPOLIA_PRIVATE_KEY.substring(0, 10) + "...");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  console.log("Tester address:", signer.address);

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/governance/GovernanceFactory.sol/GovernanceFactory.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.Contract(factoryAddress, artifact.abi, signer);

  console.log("\n Checking factory state...");
  const owner = await factory.owner();
  const openCreation = await factory.openCreation();
  const proposalCount = await factory.proposalCount();
  console.log(`   Owner: ${owner}`);
  console.log(`   Open creation: ${openCreation}`);
  console.log(`   Proposal count: ${proposalCount}`);

  console.log("\n Creating a test proposal...");
  const tx = await factory.createProposal(
    "Test Proposal via Factory",
    "This proposal was created through the GovernanceFactory",
    0, // Economics category
    7 * 24 * 60 * 60, // 7 days
    signer.address // proposer
  );
  await tx.wait();
  console.log(" Proposal created!");

  console.log("\n Checking updated proposal count...");
  const newProposalCount = await factory.proposalCount();
  console.log(`   Total proposals: ${newProposalCount}`);

  if (newProposalCount > 0n) {
    console.log("\n Getting proposal registry details...");
    const proposalRegistry = await factory.proposals(0);
    console.log(`   Contract: ${proposalRegistry.proposalContract}`);
    console.log(`   Title: ${proposalRegistry.title}`);
    console.log(`   Proposer: ${proposalRegistry.proposer}`);
    console.log(`   Active: ${proposalRegistry.active}`);

    // Test the individual proposal contract
    const proposalArtifactPath = path.join(
      __dirname,
      "../artifacts/contracts/governance/Proposal.sol/Proposal.json"
    );
    const proposalArtifact = JSON.parse(fs.readFileSync(proposalArtifactPath, "utf8"));
    const proposal = new ethers.Contract(proposalRegistry.proposalContract, proposalArtifact.abi, signer);

    console.log("\n Testing individual proposal contract...");
    const proposalTitle = await proposal.title();
    const proposalOwner = await proposal.owner();
    const proposalState = await proposal.state();
    console.log(`   Title: ${proposalTitle}`);
    console.log(`   Owner: ${proposalOwner}`);
    console.log(`   State: ${["Active", "Passed", "Failed"][Number(proposalState)]}`);

    // Test owner-only update
    console.log("\n Testing owner update...");
    const updateTx = await proposal.updateTitle("Updated Test Proposal", signer.address);
    await updateTx.wait();
    const updatedTitle = await proposal.title();
    console.log(`   Updated title: ${updatedTitle}`);
  }

  console.log("\n All tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
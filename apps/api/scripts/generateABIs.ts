import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_DIR = path.join(__dirname, "../../../packages/smart-contracts/artifacts/contracts");
const OUTPUT_DIR = path.join(__dirname, "../src/contracts");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "generated.ts");

// Proper ABI type definitions
interface ABIInput {
  internalType: string;
  name: string;
  type: string;
  components?: ABIInput[];
  indexed?: boolean; // For event inputs
}

interface ABIOutput {
  internalType: string;
  name: string;
  type: string;
  components?: ABIOutput[];
}

interface ABIItem {
  type: "function" | "event" | "constructor" | "fallback" | "receive" | "error";
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: "pure" | "view" | "nonpayable" | "payable";
  anonymous?: boolean;
}

type ABI = readonly ABIItem[];

interface ContractArtifact {
  abi: ABI;
  bytecode: string;
  contractName: string;
}

interface ABICollection {
  [contractName: string]: ABI;
}

interface ContractConfig {
  name: string;
  export: string;
  path: string;
}

function extractABI(filePath: string): ABI | null {
  try {
    const artifact: ContractArtifact = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return artifact.abi;
  } catch (error) {
    console.error(
      `Failed to extract ABI from ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

function findContractFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string): void {
    if (!fs.existsSync(currentDir)) return;

    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith(".json") && !item.includes(".dbg.")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function generateABIs(): void {
  console.log("Generating contract ABIs...");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const contractFiles = findContractFiles(CONTRACTS_DIR);
  console.log(`Found ${contractFiles.length} contract artifacts`);

  const abis: ABICollection = {};
  const contracts: ContractConfig[] = [
    {
      name: "StudyFactory",
      export: "STUDY_FACTORY_ABI",
      path: "studies/StudyFactory.sol/StudyFactory.json",
    },
    { name: "Study", export: "STUDY_ABI", path: "studies/Study.sol/Study.json" },
    {
      name: "Groth16Verifier",
      export: "MEDICAL_ELIGIBILITY_VERIFIER_ABI",
      path: "studies/MedicalEligibilityVerifier.sol/Groth16Verifier.json",
    },
    {
      name: "AuditTrail",
      export: "AUDIT_TRAIL_ABI",
      path: "audit/AuditTrail.sol/AuditTrail.json",
    },
  ];

  for (const contract of contracts) {
    const normalizedPath = contract.path.replaceAll("/", path.sep);
    const contractFile = contractFiles.find(
      (file) => file.includes(path.sep + normalizedPath) || file.endsWith(normalizedPath)
    );

    if (contractFile) {
      console.log(`Processing ${contract.name}...`);
      const abi = extractABI(contractFile);

      if (abi) {
        abis[contract.export] = abi;
      }
    } else {
      console.error(`Contract file not found for ${contract.name}`);
    }
  }

  if (Object.keys(abis).length === 0) {
    throw new Error("No ABIs were extracted!");
  }

  let output = `// Auto-generated contract ABIs\n// Generated on ${new Date().toISOString()}\n\n`;

  output += `// ABI type definitions\ninterface ABIInput {\n  internalType: string;\n  name: string;\n  type: string;\n  components?: ABIInput[];\n  indexed?: boolean; // For event inputs\n}\n\ninterface ABIOutput {\n  internalType: string;\n  name: string;\n  type: string;\n  components?: ABIOutput[];\n}\n\ninterface ABIItem {\n  type: 'function' | 'event' | 'constructor' | 'fallback' | 'receive' | 'error';\n  name?: string;\n  inputs?: ABIInput[];\n  outputs?: ABIOutput[];\n  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';\n  anonymous?: boolean;\n}\n\nexport type ABI = readonly ABIItem[];\n\n`;

  for (const contract of contracts) {
    if (abis[contract.export]) {
      output += `export const ${contract.export}: ABI = ${JSON.stringify(
        abis[contract.export],
        null,
        2
      )} as const;\n\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output);

  console.log(`Contract ABIs generated successfully at ${OUTPUT_FILE}`);
  console.log(`Generated ${Object.keys(abis).length} contract ABIs`);
}

try {
  generateABIs();
} catch (error) {
  console.error(
    "Failed to generate ABIs:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
}

export { generateABIs };

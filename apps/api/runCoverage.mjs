import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Current working package folder
const packageDir = dirname(fileURLToPath(import.meta.url));

// Find project root by walking upward until we find package.json with "workspaces"
function findProjectRoot(dir) {
  let current = dir;
  while (true) {
    try {
      const pkg = require(resolve(current, "package.json"));
      // Root package.json in monorepo usually contains "workspaces"
      if (pkg.workspaces) return current;
    } catch {}
    // Move up one directory
    const parent = resolve(current, "..");
    if (parent === current) {
      throw new Error("Unable to find repo root");
    }
    current = parent;
  }
}

const projectRoot = findProjectRoot(packageDir);

// Absolute path to the coverage script in repo root
const scriptPath = resolve(projectRoot, "scripts/runCoveragePerTest.ts");

console.log(`→ Running per-test coverage from: ${scriptPath}`);

execSync(`bun ${scriptPath}`, { stdio: "inherit" });

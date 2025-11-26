#!/usr/bin/env bun
/**
 * Test Coverage Orchestrator
 *
 * This script runs each test file individually with coverage enabled,
 * generating separate lcov files per test, then merges them into a
 * comprehensive coverage report.
 */

import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Determine the working directory and root directory
 * - If running from workspace root: use root and scan all workspaces
 * - If running from a workspace (apps/api, apps/web): use that workspace as root
 */
function determineDirectories(): { rootDir: string; workspaces: string[] } {
  const cwd = process.cwd();
  const repoRoot = path.resolve(__dirname, "..");

  // Check if we're in a specific workspace
  const relativeFromRepo = path.relative(repoRoot, cwd);

  if (relativeFromRepo.startsWith("apps/api")) {
    return {
      rootDir: path.join(repoRoot, "apps/api"),
      workspaces: ["."], // Only scan current directory
    };
  } else if (relativeFromRepo.startsWith("apps/web")) {
    return {
      rootDir: path.join(repoRoot, "apps/web"),
      workspaces: ["."], // Only scan current directory
    };
  } else {
    // Running from repo root
    return {
      rootDir: repoRoot,
      workspaces: ["apps/api", "apps/web", "packages/shared"],
    };
  }
}

const { rootDir, workspaces } = determineDirectories();
const coverageDir = path.join(rootDir, "coverage");
const lcovDir = path.join(coverageDir, "lcov-files");
const testResultsDir = path.join(coverageDir, "test-results");

interface TestResult {
  file: string;
  success: boolean;
  lcovFile?: string;
  error?: string;
}

/**
 * Find all test files in the workspace
 */
async function findTestFiles(): Promise<string[]> {
  const testFiles: string[] = [];

  for (const workspace of workspaces) {
    const workspacePath = path.join(rootDir, workspace);
    try {
      await fs.access(workspacePath);
      const files = await findTestFilesRecursive(workspacePath);
      testFiles.push(...files);
    } catch {
      console.log(`Skipping ${workspace} - directory not accessible`);
    }
  }

  return testFiles;
}

/**
 * Recursively find test files in a directory
 */
async function findTestFilesRecursive(dir: string): Promise<string[]> {
  const testFiles: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, dist, coverage, etc.
      if (!["node_modules", "dist", "coverage", ".next", "build"].includes(entry.name)) {
        testFiles.push(...(await findTestFilesRecursive(fullPath)));
      }
    } else if (entry.isFile()) {
      // Match .test.ts, .test.tsx, .spec.ts, .spec.tsx files
      if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        testFiles.push(fullPath);
      }
    }
  }

  return testFiles;
}

/**
 * Run a single test file with coverage
 */
async function runTestWithCoverage(testFile: string): Promise<TestResult> {
  const relativePath = path.relative(rootDir, testFile);
  const testName = relativePath
    .replace(/[/\\]/g, "-")
    .replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, "");
  const lcovFile = path.join(lcovDir, `${testName}.info`);
  const testOutputFile = path.join(testResultsDir, `${testName}.log`);

  console.log(`\n📝 Running: ${relativePath}`);

  return new Promise((resolve) => {
    const childProcess = spawn(
      process.execPath,
      ["test", testFile, "--coverage", "--coverage-reporter=lcov"],
      {
        cwd: rootDir,
        env: {
          ...process.env,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const outputChunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    childProcess.stdout?.on("data", (data: Buffer) => {
      outputChunks.push(data);
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      errorChunks.push(data);
    });

    childProcess.on("close", async (code: number | null) => {
      // Save test output to file
      try {
        const outputContent = Buffer.concat(outputChunks).toString("utf-8");
        const errorContent = Buffer.concat(errorChunks).toString("utf-8");
        const combinedOutput = `Test: ${relativePath}\nExit Code: ${code}\n\n=== STDOUT ===\n${outputContent}\n\n=== STDERR ===\n${errorContent}`;
        await fs.writeFile(testOutputFile, combinedOutput, "utf-8");
      } catch (error) {
        console.log(`⚠️  Failed to save test output: ${error}`);
      }

      // Check if lcov file was created in the default coverage directory
      try {
        const defaultCoverageDir = path.join(rootDir, "coverage");
        const defaultLcovPath = path.join(defaultCoverageDir, "lcov.info");

        try {
          await fs.access(defaultLcovPath);
          // Move it to our lcov-files directory with unique name
          await fs.copyFile(defaultLcovPath, lcovFile);

          console.log(`✅ ${relativePath} - Coverage saved to ${path.basename(lcovFile)}`);
          resolve({
            file: relativePath,
            success: code === 0,
            lcovFile,
          });
        } catch {
          console.log(
            `⚠️  ${relativePath} - No coverage generated (tests may have passed but no coverage data)`
          );
          resolve({
            file: relativePath,
            success: code === 0,
            error: "No coverage file generated",
          });
        }
      } catch (error) {
        console.log(`❌ ${relativePath} - Error: ${error}`);
        resolve({
          file: relativePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  });
}

/**
 * Merge multiple lcov files into one
 */
async function mergeLcovFiles(lcovFiles: string[]): Promise<void> {
  console.log("\n🔀 Merging coverage files...");

  const mergedContent: string[] = [];

  for (const lcovFile of lcovFiles) {
    try {
      const content = await fs.readFile(lcovFile, "utf-8");
      mergedContent.push(content);
    } catch (error) {
      console.error(`Failed to read ${lcovFile}:`, error);
    }
  }

  const finalLcov = path.join(coverageDir, "lcov.info");
  await fs.writeFile(finalLcov, mergedContent.join("\n"), "utf-8");

  console.log(`✅ Merged coverage report saved to: ${finalLcov}`);
}
/**
 * Find the full path to genhtml executable
 */
async function findGenhtml(): Promise<string | null> {
  return new Promise((resolve) => {
    const whichProcess = spawn("/usr/bin/which", ["genhtml"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    whichProcess.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    whichProcess.on("close", (code: number | null) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });

    whichProcess.on("error", () => {
      resolve(null);
    });
  });
}
/**
 * Generate HTML coverage report
 */
async function generateHtmlReport(): Promise<void> {
  console.log("\n📊 Generating HTML coverage report...");
  const genhtmlPath = await findGenhtml();

  if (!genhtmlPath) {
    console.log("⚠️  genhtml not available. Install lcov to generate HTML reports.");
    return;
  }
  return new Promise((resolve) => {
    const childProcess = spawn(
      genhtmlPath,
      [
        path.join(coverageDir, "lcov.info"),
        "-o",
        path.join(coverageDir, "html"),
        "--title",
        "ZK Medical Data Exchange Coverage",
      ],
      {
        cwd: rootDir,
        stdio: "inherit",
      }
    );

    childProcess.on("close", (code: number | null) => {
      if (code === 0) {
        console.log(`✅ HTML report generated: ${path.join(coverageDir, "html", "index.html")}`);
        resolve();
      } else {
        console.log("⚠️  genhtml not available. Install lcov to generate HTML reports.");
        resolve(); // Don't fail if genhtml is not available
      }
    });

    childProcess.on("error", () => {
      console.log("⚠️  genhtml not available. Skipping HTML report generation.");
      resolve();
    });
  });
}

/**
 * Clean up coverage directory
 */
async function cleanCoverageDir(): Promise<void> {
  try {
    await fs.rm(coverageDir, { recursive: true, force: true });
    await fs.mkdir(lcovDir, { recursive: true });
    await fs.mkdir(testResultsDir, { recursive: true });
    console.log("🧹 Cleaned coverage directory");
  } catch (error) {
    console.error("Error cleaning coverage directory:", error);
  }
}

/**
 * Print summary
 */
function printSummary(results: TestResult[]): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST COVERAGE SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success && r.lcovFile);
  const failed = results.filter((r) => !r.success || !r.lcovFile);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log("\nFailed tests:");
    failed.forEach((r) => {
      console.log(`  - ${r.file}${r.error ? `: ${r.error}` : ""}`);
    });
  }

  console.log("\n" + "=".repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Test Coverage Orchestrator\n");
  console.log(`📂 Working directory: ${rootDir}`);
  console.log(`📦 Coverage output: ${coverageDir}\n`);

  // Clean and prepare directories
  await cleanCoverageDir();

  // Find all test files
  const testFiles = await findTestFiles();
  console.log(`\n📁 Found ${testFiles.length} test files\n`);

  if (testFiles.length === 0) {
    console.log("No test files found. Exiting.");
    process.exit(0);
  }

  // Run each test file individually
  const results: TestResult[] = [];
  for (const testFile of testFiles) {
    const result = await runTestWithCoverage(testFile);
    results.push(result);
  }

  // Merge lcov files
  const lcovFiles = results.filter((r) => r.lcovFile).map((r) => r.lcovFile!);

  if (lcovFiles.length > 0) {
    await mergeLcovFiles(lcovFiles);
    await generateHtmlReport();
  } else {
    console.log("\n⚠️  No coverage files to merge");
  }

  // Print summary
  printSummary(results);

  // Exit with error if any tests failed
  const hasFailures = results.some((r) => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

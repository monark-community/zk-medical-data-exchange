#!/usr/bin/env node

/**
 * Test Runner for Complete Study Flow
 * This script tests the entire study creation and participation workflow
 */

import { testCompleteStudyFlow } from "../test/studyFlowTest";

const main = async () => {
  console.log("🚀 Starting Complete Study Flow Test...\n");

  try {
    await testCompleteStudyFlow();
    console.log("🎉 All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Test failed:", error);
    process.exit(1);
  }
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

# Test Coverage Per Test

This directory contains scripts for running comprehensive test coverage analysis.

## Why This Approach?

**Problem**: Bun's test runner uses `mock.module()` which creates global mocks. This causes internal conflicts when multiple test files are run together in the same process, leading to:

- Mock pollution across test files
- Unpredictable test failures
- Incorrect coverage data
- Global state interference

**Solution**: Run each test file individually in its own isolated process to avoid global mock conflicts and ensure accurate coverage tracking.

## Overview

The `runCoveragePerTest.ts` script orchestrates individual test execution with coverage tracking:

1. **Discovers** all test files across the workspace (`apps/api`, `apps/web`, `packages/shared`)
2. **Runs** each test file individually in isolation with coverage enabled
3. **Captures** test output (stdout/stderr) and saves to `coverage/test-results/`
4. **Generates** separate lcov files per test (stored in `coverage/lcov-files/`)
5. **Merges** all lcov files into a comprehensive `coverage/lcov.info`
6. **Creates** HTML coverage reports (if `genhtml` is available)

## Usage

Run coverage for all tests:

```bash
bun run coverage:per-test
```

## Benefits

- **Isolation**: Each test runs in its own process, preventing mock contamination between files
- **Reliability**: Eliminates Bun's `mock.module()` global state conflicts
- **Debugging**: Individual lcov and log files help identify which tests cover which code
- **Coverage Accuracy**: Better coverage data by avoiding test interaction issues
- **Traceability**: Clear mapping between test files and their coverage contribution
- **Test Output Logging**: Complete test results saved for review and debugging

## Output Structure

```
coverage/
├── lcov-files/          # Individual lcov files per test
│   ├── apps-api-src-services-userService.info
│   ├── apps-api-src-services-studyService.info
│   └── ...
├── test-results/        # Individual test output logs
│   ├── apps-api-src-services-userService.log
│   ├── apps-api-src-services-studyService.log
│   └── ...
├── lcov.info            # Merged coverage report
└── html/                # HTML coverage report (optional)
    └── index.html
```

## Test Output Logs

Each test run generates a detailed log file in `coverage/test-results/` containing:

- Test file path
- Exit code (0 = success, non-zero = failure)
- Complete stdout (test results, timing, pass/fail status)
- Complete stderr (errors, warnings)

Example log content:

```
✓ governanceController > getStats > returns platform statistics successfully [0.24ms]
✓ governanceController > getStats > handles error when fetching stats [0.02ms]
✓ governanceController > getAllProposals > returns all proposals without user address [0.13ms]
...
```

## HTML Reports

If you have `lcov` installed, HTML reports will be generated automatically:

```bash
# macOS
brew install lcov

# Ubuntu/Debian
sudo apt-get install lcov
```

View the HTML report by opening `coverage/html/index.html` in your browser.

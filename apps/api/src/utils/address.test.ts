import { describe, test, expect } from "bun:test";
import { isValidEthereumAddress } from "./address";

describe("isValidEthereumAddress", () => {
  test("should return true for valid Ethereum addresses", () => {
    // Valid checksummed address
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toBe(true);
    // Valid lowercase address
    expect(isValidEthereumAddress("0x742d35cc6634c0532925a3b844bc454e4438f44e")).toBe(true);
    // Valid uppercase address
    expect(isValidEthereumAddress("0x742D35CC6634C0532925A3B844BC454E4438F44E")).toBe(true);
    // Valid mixed case address
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toBe(true);
  });

  test("should return false for invalid address formats", () => {
    // Missing 0x prefix
    expect(isValidEthereumAddress("742d35Cc6634C0532925a3b844Bc454e4438f44e")).toBe(false);
    // Wrong prefix
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44")).toBe(false);
    // Too short
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44")).toBe(false);
    // Too long
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e1")).toBe(false);
    // Invalid characters
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44g")).toBe(false);
    // Contains invalid character 'g'
    expect(isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44g")).toBe(false);
  });

  test("should return false for non-string inputs", () => {
    // null
    expect(isValidEthereumAddress(null)).toBe(false);
    // undefined
    expect(isValidEthereumAddress(undefined)).toBe(false);
    // number
    expect(isValidEthereumAddress(123)).toBe(false);
    // boolean
    expect(isValidEthereumAddress(true)).toBe(false);
    // object
    expect(isValidEthereumAddress({})).toBe(false);
    // array
    expect(isValidEthereumAddress([])).toBe(false);
  });

  test("should return false for empty or whitespace strings", () => {
    // Empty string
    expect(isValidEthereumAddress("")).toBe(false);
    // Whitespace only
    expect(isValidEthereumAddress("   ")).toBe(false);
    // Just 0x
    expect(isValidEthereumAddress("0x")).toBe(false);
  });

  test("should handle edge cases", () => {
    // Address with all zeros
    expect(isValidEthereumAddress("0x0000000000000000000000000000000000000000")).toBe(true);
    // Address with all Fs
    expect(isValidEthereumAddress("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toBe(true);
    // Mixed case with numbers
    expect(isValidEthereumAddress("0x1234567890abcdef1234567890ABCDEF12345678")).toBe(true);
  });
});

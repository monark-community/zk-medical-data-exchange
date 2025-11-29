import { describe, it, expect, beforeEach } from "bun:test";
import { addAESKeyToStore, getAESKey, clearAESKey, hasValidAESKey } from "./aesKeyStore";

describe("AES Key Store", () => {
  const testKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

  beforeEach(() => {
    // Clear the key store before each test
    clearAESKey();
  });

  describe("addAESKeyToStore", () => {
    it("should store AES key", () => {
      addAESKeyToStore(testKey, testAddress);

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(testKey);
    });

    it("should store key without wallet address", () => {
      addAESKeyToStore(testKey);

      // Should not return key without matching address
      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();
    });

    it("should overwrite existing key", () => {
      const firstKey = "first_key_12345678901234567890123456789012345678901234567890";
      const secondKey = "second_key_1234567890123456789012345678901234567890123456789";

      addAESKeyToStore(firstKey, testAddress);
      addAESKeyToStore(secondKey, testAddress);

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(secondKey);
    });
  });

  describe("getAESKey", () => {
    it("should return null if no key stored", () => {
      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();
    });

    it("should return key if valid and address matches", () => {
      addAESKeyToStore(testKey, testAddress);

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(testKey);
    });

    it("should return null if address does not match", () => {
      addAESKeyToStore(testKey, testAddress);

      const differentAddress = "0x1234567890123456789012345678901234567890";
      const retrievedKey = getAESKey(differentAddress);

      expect(retrievedKey).toBeNull();
    });

    it("should return null if key expired (after 1 hour)", () => {
      addAESKeyToStore(testKey, testAddress);

      // Mock Date.now to simulate 1 hour + 1 second later
      const originalNow = Date.now;
      Date.now = () => originalNow() + (60 * 60 * 1000 + 1000);

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();

      // Restore
      Date.now = originalNow;
    });

    it("should return key if within 1 hour cache duration", () => {
      addAESKeyToStore(testKey, testAddress);

      // Mock Date.now to simulate 30 minutes later
      const originalNow = Date.now;
      Date.now = () => originalNow() + 30 * 60 * 1000;

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(testKey);

      // Restore
      Date.now = originalNow;
    });

    it("should clear expired key when accessing", () => {
      addAESKeyToStore(testKey, testAddress);

      // Mock Date.now to simulate expiration
      const originalNow = Date.now;
      Date.now = () => originalNow() + 2 * 60 * 60 * 1000; // 2 hours

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();

      // Restore time and verify key is still cleared
      Date.now = originalNow;
      const retrievedAgain = getAESKey(testAddress);
      expect(retrievedAgain).toBeNull();

      // Restore
      Date.now = originalNow;
    });

    it("should handle retrieval without wallet address", () => {
      addAESKeyToStore(testKey);

      const retrievedKey = getAESKey();
      expect(retrievedKey).toBeNull();
    });
  });

  describe("clearAESKey", () => {
    it("should clear stored key", () => {
      addAESKeyToStore(testKey, testAddress);

      clearAESKey();

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();
    });

    it("should be safe to call when no key is stored", () => {
      expect(() => clearAESKey()).not.toThrow();
    });

    it("should clear multiple times safely", () => {
      addAESKeyToStore(testKey, testAddress);
      clearAESKey();
      clearAESKey();
      clearAESKey();

      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();
    });
  });

  describe("hasValidAESKey", () => {
    it("should return false if no key stored", () => {
      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(false);
    });

    it("should return true if valid key with matching address", () => {
      addAESKeyToStore(testKey, testAddress);

      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(true);
    });

    it("should return false if address does not match", () => {
      addAESKeyToStore(testKey, testAddress);

      const differentAddress = "0x1234567890123456789012345678901234567890";
      const hasKey = hasValidAESKey(differentAddress);

      expect(hasKey).toBe(false);
    });

    it("should return false if key expired", () => {
      addAESKeyToStore(testKey, testAddress);

      // Mock Date.now to simulate expiration
      const originalNow = Date.now;
      Date.now = () => originalNow() + 2 * 60 * 60 * 1000;

      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(false);

      // Restore
      Date.now = originalNow;
    });

    it("should return true within cache duration", () => {
      addAESKeyToStore(testKey, testAddress);

      // Mock Date.now to simulate 45 minutes later
      const originalNow = Date.now;
      Date.now = () => originalNow() + 45 * 60 * 1000;

      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(true);

      // Restore
      Date.now = originalNow;
    });

    it("should return false after clearing", () => {
      addAESKeyToStore(testKey, testAddress);
      clearAESKey();

      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(false);
    });
  });

  describe("Security features", () => {
    it("should store key only in memory (not persistent)", () => {
      addAESKeyToStore(testKey, testAddress);

      // Verify it's not in localStorage or sessionStorage (if they exist in browser environment)
      if (typeof localStorage !== "undefined") {
        const inLocalStorage = localStorage.getItem("aesKey");
        expect(inLocalStorage).toBeNull();
      }

      if (typeof sessionStorage !== "undefined") {
        const inSessionStorage = sessionStorage.getItem("aesKey");
        expect(inSessionStorage).toBeNull();
      }

      // But should be retrievable in memory
      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(testKey);
    });

    it("should require re-derivation after cache expiration", () => {
      addAESKeyToStore(testKey, testAddress);

      const originalNow = Date.now;
      Date.now = () => originalNow() + 2 * 60 * 60 * 1000;

      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(false);

      // User would need to sign again to re-derive the key
      const newKey = "new_derived_key_567890123456789012345678901234567890123456789";
      addAESKeyToStore(newKey, testAddress);

      Date.now = originalNow;
      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBe(newKey);

      Date.now = originalNow;
    });

    it("should handle multiple wallet addresses independently", () => {
      const address1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      const address2 = "0x1234567890123456789012345678901234567890";
      const key1 = "key1_234567890123456789012345678901234567890123456789012345";
      const key2 = "key2_234567890123456789012345678901234567890123456789012345";

      addAESKeyToStore(key1, address1);
      expect(hasValidAESKey(address1)).toBe(true);
      expect(hasValidAESKey(address2)).toBe(false);

      // Switching to address2 should clear previous key
      addAESKeyToStore(key2, address2);
      expect(hasValidAESKey(address2)).toBe(true);
      expect(hasValidAESKey(address1)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string key", () => {
      // Empty string key is falsy, so getAESKey will return null
      addAESKeyToStore("", testAddress);
      const retrievedKey = getAESKey(testAddress);
      expect(retrievedKey).toBeNull();
    });

    it("should handle empty string address", () => {
      // Empty string address is falsy, so isValidAddress will be false
      addAESKeyToStore(testKey, "");
      const retrievedKey = getAESKey("");
      expect(retrievedKey).toBeNull();
    });

    it("should handle exactly 1 hour cache duration", () => {
      addAESKeyToStore(testKey, testAddress);

      const originalNow = Date.now;
      Date.now = () => originalNow() + 60 * 60 * 1000; // Exactly 1 hour

      // Should be invalid at exactly 1 hour
      const hasKey = hasValidAESKey(testAddress);
      expect(hasKey).toBe(false);

      Date.now = originalNow;
    });
  });
});

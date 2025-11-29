import { describe, it, expect, beforeEach, mock } from "bun:test";
import crypto from "crypto";

// Mock Config
const mockConfig = {
  APP_SALT: "test-salt-12345",
};

mock.module("@/config/config", () => ({
  Config: mockConfig,
}));

import { generateAESKey, encryptWithKey, decryptWithKey } from "./encryption";

describe("Encryption Utils", () => {
  describe("generateAESKey", () => {
    it("should generate a 64-character hex key from wallet key", () => {
      const walletKey = new Uint8Array([1, 2, 3, 4, 5]);
      const key = generateAESKey(walletKey);

      expect(key).toBeString();
      expect(key.length).toBe(64);
      expect(/^[0-9a-f]{64}$/i.test(key)).toBe(true);
    });

    it("should generate the same key for the same wallet key", () => {
      const walletKey = new Uint8Array([1, 2, 3, 4, 5]);
      const key1 = generateAESKey(walletKey);
      const key2 = generateAESKey(walletKey);

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different wallet keys", () => {
      const walletKey1 = new Uint8Array([1, 2, 3, 4, 5]);
      const walletKey2 = new Uint8Array([5, 4, 3, 2, 1]);
      const key1 = generateAESKey(walletKey1);
      const key2 = generateAESKey(walletKey2);

      expect(key1).not.toBe(key2);
    });

    it("should incorporate APP_SALT in key generation", () => {
      const walletKey = new Uint8Array([1, 2, 3, 4, 5]);
      const key1 = generateAESKey(walletKey);

      // Change salt
      mockConfig.APP_SALT = "different-salt";
      const key2 = generateAESKey(walletKey);

      expect(key1).not.toBe(key2);

      // Restore
      mockConfig.APP_SALT = "test-salt-12345";
    });
  });

  describe("encryptWithKey and decryptWithKey", () => {
    const testKey = crypto.randomBytes(32);
    const testText = "Hello, this is a secret message!";

    it("should encrypt and decrypt text correctly with Buffer key", () => {
      const encrypted = encryptWithKey(testText, testKey);
      const decrypted = decryptWithKey(encrypted, testKey);

      expect(decrypted).toBe(testText);
    });

    it("should encrypt and decrypt text correctly with string key", () => {
      const stringKey = "my-secret-password";
      const encrypted = encryptWithKey(testText, stringKey);
      const decrypted = decryptWithKey(encrypted, stringKey);

      expect(decrypted).toBe(testText);
    });

    it("should return base64 encoded string", () => {
      const encrypted = encryptWithKey(testText, testKey);

      expect(encrypted).toBeString();
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });

    it("should produce different ciphertext for same plaintext (different IV)", () => {
      const encrypted1 = encryptWithKey(testText, testKey);
      const encrypted2 = encryptWithKey(testText, testKey);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same text
      const decrypted1 = decryptWithKey(encrypted1, testKey);
      const decrypted2 = decryptWithKey(encrypted2, testKey);

      expect(decrypted1).toBe(testText);
      expect(decrypted2).toBe(testText);
    });

    it("should fail to decrypt with wrong key", () => {
      const encrypted = encryptWithKey(testText, testKey);
      const wrongKey = crypto.randomBytes(32);

      const originalConsoleError = console.error;
      console.error = () => {};

      expect(() => decryptWithKey(encrypted, wrongKey)).toThrow();

      console.error = originalConsoleError;
    });

    it("should handle empty string", () => {
      const encrypted = encryptWithKey("", testKey);
      const decrypted = decryptWithKey(encrypted, testKey);

      expect(decrypted).toBe("");
    });

    it("should handle long text", () => {
      const longText = "A".repeat(10000);
      const encrypted = encryptWithKey(longText, testKey);
      const decrypted = decryptWithKey(encrypted, testKey);

      expect(decrypted).toBe(longText);
    });

    it("should handle special characters and unicode", () => {
      const specialText = "Hello 世界! 🌍 émojis & spëcial çhars";
      const encrypted = encryptWithKey(specialText, testKey);
      const decrypted = decryptWithKey(encrypted, testKey);

      expect(decrypted).toBe(specialText);
    });

    it("should fail on tampered ciphertext", () => {
      const encrypted = encryptWithKey(testText, testKey);
      const payload = JSON.parse(Buffer.from(encrypted, "base64").toString("utf8"));

      // Tamper with ciphertext
      const tamperedCt = Buffer.from(payload.ct, "base64");
      tamperedCt[0] = tamperedCt[0] ^ 0xff;
      payload.ct = tamperedCt.toString("base64");

      const tamperedEncrypted = Buffer.from(JSON.stringify(payload)).toString("base64");

      // Suppress error output during test
      const originalConsoleError = console.error;
      console.error = () => {};

      expect(() => decryptWithKey(tamperedEncrypted, testKey)).toThrow();

      console.error = originalConsoleError;
    });

    it("should contain IV, tag, and ciphertext in encrypted payload", () => {
      const encrypted = encryptWithKey(testText, testKey);
      const payload = JSON.parse(Buffer.from(encrypted, "base64").toString("utf8"));

      expect(payload).toHaveProperty("iv");
      expect(payload).toHaveProperty("tag");
      expect(payload).toHaveProperty("ct");
    });
  });

  describe("Integration tests", () => {
    it("should work with wallet-derived key", () => {
      const walletKey = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));
      const aesKeyHex = generateAESKey(walletKey);
      const aesKeyBuffer = Buffer.from(aesKeyHex, "hex");

      const message = "Patient data: Age 30, BMI 24.5";
      const encrypted = encryptWithKey(message, aesKeyBuffer);
      const decrypted = decryptWithKey(encrypted, aesKeyBuffer);

      expect(decrypted).toBe(message);
    });

    it("should handle JSON data encryption", () => {
      const testKey = crypto.randomBytes(32);
      const jsonData = { age: 30, name: "John", conditions: ["diabetes", "hypertension"] };
      const jsonString = JSON.stringify(jsonData);

      const encrypted = encryptWithKey(jsonString, testKey);
      const decrypted = decryptWithKey(encrypted, testKey);
      const parsedData = JSON.parse(decrypted);

      expect(parsedData).toEqual(jsonData);
    });
  });
});

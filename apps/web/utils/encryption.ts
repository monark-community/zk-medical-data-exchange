import { Config } from "@/config/config";
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

/**
 * Derives a deterministic AES-256 key from wallet key + app salt.
 */
export function generateAESKey(walletKey: Uint8Array): string {
  const combined = new Uint8Array(
    walletKey.length + new TextEncoder().encode(Config.APP_SALT).length
  );
  combined.set(walletKey);
  combined.set(new TextEncoder().encode(Config.APP_SALT), walletKey.length);

  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  return hash; // 64 hex chars = 256-bit AES key
}

/**
 * Encrypts a string using AES-256-GCM.
 */
export const encryptWithKey = (text: string, key: Buffer | string): string => {
  const aesKey = typeof key === "string" ? crypto.createHash("sha256").update(key).digest() : key;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, aesKey, iv);

  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = {
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
    ct: ciphertext.toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

/**
 * Decrypts a string using AES-256-GCM.
 */
export const decryptWithKey = (encrypted: string, key: Buffer | string): string => {
  const payload = JSON.parse(Buffer.from(encrypted, "base64").toString("utf8"));

  const aesKey = typeof key === "string" ? crypto.createHash("sha256").update(key).digest() : key;
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ct, "base64");

  const decipher = crypto.createDecipheriv(ALGO, aesKey, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
};

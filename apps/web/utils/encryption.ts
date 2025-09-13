import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

/**
 * Encrypts a string with a given key using AES-256-GCM.
 *
 * @param text - The plain text to encrypt.
 * @param key - The secret key string used for encryption.
 * @returns The encrypted payload as a base64 string.
 */
export const encryptWithKey = (text: string, key: string): string => {
  const aesKey = crypto.createHash("sha256").update(key).digest();

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
 * Decrypts a string with a given key using AES-256-GCM.
 *
 * @param encrypted - The encrypted payload produced by encryptText.
 * @param key - The same key string used for encryption.
 * @returns The decrypted plain text.
 */
export const decryptWithKey = (encrypted: string, key: string): string => {
  const payload = JSON.parse(Buffer.from(encrypted, "base64").toString("utf8"));

  const aesKey = crypto.createHash("sha256").update(key).digest();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ct, "base64");

  const decipher = crypto.createDecipheriv(ALGO, aesKey, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
};

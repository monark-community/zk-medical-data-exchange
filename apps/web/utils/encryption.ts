import { Config } from "@/config/config";
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

/**
 * Derives a deterministic AES-256 key from a wallet key and app salt.
 *
 * @param {Uint8Array} walletKey - The user's wallet key as a Uint8Array.
 * @returns {string} A 64-character hexadecimal string representing the 256-bit AES key.
 */
export function generateAESKey(walletKey: Uint8Array): string {
  const combined = new Uint8Array(
    walletKey.length + new TextEncoder().encode(Config.APP_SALT).length
  );
  combined.set(walletKey);
  combined.set(new TextEncoder().encode(Config.APP_SALT), walletKey.length);

  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  return hash;
}

/**
 * Encrypts a string using AES-256-GCM.
 *
 * @param {string} text - The plaintext string to encrypt.
 * @param {Buffer | string} key - The AES key as a Buffer or string.
 * @returns {string} Base64-encoded string containing IV, auth tag, and ciphertext.
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
 * Decrypts a string previously encrypted with AES-256-GCM.
 *
 * @param {string} encrypted - Base64 string returned by encryptWithKey.
 * @param {Buffer | string} key - The same AES key used for encryption.
 * @returns {string} The decrypted plaintext string.
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

/**
 * Encrypts medical data for upload using RSA-OAEP and AES-GCM hybrid encryption.
 * This is designed for the browser environment using Web Crypto API.
 * 
 * Process:
 * 1. Generate random AES-256 key
 * 2. Encrypt the medical data with AES-256-GCM
 * 3. Encrypt the AES key with the study's RSA public key
 * 4. Return both encrypted components
 * 
 * @param {any} medicalData - The medical data object to encrypt
 * @param {string} publicKeyPem - The study's RSA public key in PEM format
 * @returns {Promise<{ encryptedData: string, encryptedKey: string }>} Base64-encoded encrypted data and key
 */
export async function encryptMedicalDataForUpload(
  medicalData: any,
  publicKeyPem: string
): Promise<{ encryptedData: string; encryptedKey: string }> {
  // Convert medical data to JSON string
  const dataString = JSON.stringify(medicalData);
  
  // Step 1: Generate random AES-256 key
  const aesKey = window.crypto.getRandomValues(new Uint8Array(32));
  
  // Step 2: Encrypt data with AES-256-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    aesKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const encodedData = new TextEncoder().encode(dataString);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    encodedData
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Convert to base64
  const encryptedData = btoa(String.fromCharCode(...combined));
  
  // Step 3: Encrypt the AES key with RSA public key
  // Remove PEM headers and decode base64
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = publicKeyPem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  const binaryDer = atob(pemContents);
  const binaryDerArray = new Uint8Array(binaryDer.length);
  for (let i = 0; i < binaryDer.length; i++) {
    binaryDerArray[i] = binaryDer.charCodeAt(i);
  }
  
  // Import RSA public key
  const rsaKey = await window.crypto.subtle.importKey(
    'spki',
    binaryDerArray,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
  
  // Encrypt AES key with RSA
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    rsaKey,
    aesKey
  );
  
  // Convert encrypted key to base64
  const encryptedKey = btoa(
    String.fromCharCode(...new Uint8Array(encryptedKeyBuffer))
  );
  
  return {
    encryptedData,
    encryptedKey,
  };
}

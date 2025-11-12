/**
 * AES Key Store - Memory-Only Storage for Security
 *
 * This module stores AES encryption keys only in memory to prevent XSS attacks.
 * Keys are re-derived from wallet signatures after page refresh for security.
 */

let aesKey: string | null = null;
let cachedAddress: string | null = null;
let keyTimestamp: number | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function addAESKeyToStore(key: string, walletAddress?: string) {
  aesKey = key;
  cachedAddress = walletAddress || null;
  keyTimestamp = Date.now();
}

export function getAESKey(currentWalletAddress?: string): string | null {
  if (aesKey && keyTimestamp) {
    const now = Date.now();
    const isValidTime = now - keyTimestamp < CACHE_DURATION;
    const isValidAddress = currentWalletAddress && cachedAddress === currentWalletAddress;

    if (isValidTime && isValidAddress) {
      return aesKey;
    } else {
      clearAESKey();
    }
  }

  return null;
}

export function clearAESKey() {
  aesKey = null;
  cachedAddress = null;
  keyTimestamp = null;
}

export function hasValidAESKey(currentWalletAddress?: string): boolean {
  return getAESKey(currentWalletAddress) !== null;
}

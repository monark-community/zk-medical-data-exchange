/**
 * AES Key Store - Memory-Only Storage for Security
 *
 * This module stores AES encryption keys only in memory to prevent XSS attacks.
 * Keys are re-derived from wallet signatures after page refresh for security.
 */

let aesKey: string | null = null;
let cachedAddress: string | null = null;
let keyTimestamp: number | null = null;

// Cache duration - memory-only, shorter duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Store AES key in memory only (not localStorage for security)
 */
export function addAESKeyToStore(key: string, walletAddress?: string) {
  aesKey = key;
  cachedAddress = walletAddress || null;
  keyTimestamp = Date.now();

  // Security Note: We intentionally do NOT store in localStorage/sessionStorage
  // to prevent XSS attacks from accessing encryption keys
}

/**
 * Retrieve AES key from memory cache if valid
 */
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

/**
 * Clear AES key from memory
 */
export function clearAESKey() {
  aesKey = null;
  cachedAddress = null;
  keyTimestamp = null;
}

/**
 * Check if we have a valid AES key for the current wallet
 */
export function hasValidAESKey(currentWalletAddress?: string): boolean {
  return getAESKey(currentWalletAddress) !== null;
}

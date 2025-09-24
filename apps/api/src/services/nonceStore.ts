import logger from '@/utils/logger';

interface NonceEntry {
  walletAddress: string;
  issuedAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * In-memory nonce store for Web3 authentication
 * In production, this should be replaced with Redis or similar
 */
class NonceStore {
  private store = new Map<string, NonceEntry>();
  private readonly NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Clean up expired nonces every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Store a new nonce for a wallet address
   */
  setNonce(nonce: string, walletAddress: string): void {
    const now = Date.now();
    this.store.set(nonce, {
      walletAddress: walletAddress.toLowerCase(),
      issuedAt: now,
      expiresAt: now + this.NONCE_EXPIRY_MS,
      used: false,
    });

    logger.debug({ nonce, walletAddress }, 'Nonce stored');
  }

  /**
   * Validate and consume a nonce
   * Returns true if nonce is valid and unused, false otherwise
   */
  validateAndConsumeNonce(nonce: string, walletAddress: string): boolean {
    const entry = this.store.get(nonce);
    
    if (!entry) {
      logger.warn({ nonce, walletAddress }, 'Nonce not found');
      return false;
    }

    if (entry.used) {
      logger.warn({ nonce, walletAddress }, 'Nonce already used');
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      logger.warn({ nonce, walletAddress }, 'Nonce expired');
      this.store.delete(nonce);
      return false;
    }

    if (entry.walletAddress !== walletAddress.toLowerCase()) {
      logger.warn({ nonce, walletAddress, storedAddress: entry.walletAddress }, 'Nonce wallet address mismatch');
      return false;
    }

    // Mark as used
    entry.used = true;
    logger.debug({ nonce, walletAddress }, 'Nonce validated and consumed');
    
    // Clean up after a short delay
    setTimeout(() => {
      this.store.delete(nonce);
    }, 30 * 1000); // Remove after 30 seconds

    return true;
  }

  /**
   * Check if a nonce exists and is valid (without consuming it)
   */
  isValidNonce(nonce: string, walletAddress: string): boolean {
    const entry = this.store.get(nonce);
    
    if (!entry) return false;
    if (entry.used) return false;
    if (Date.now() > entry.expiresAt) return false;
    if (entry.walletAddress !== walletAddress.toLowerCase()) return false;

    return true;
  }

  /**
   * Clean up expired nonces
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [nonce, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(nonce);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug({ cleanedCount }, 'Cleaned up expired nonces');
    }
  }

  /**
   * Get store statistics for monitoring
   */
  getStats() {
    return {
      totalNonces: this.store.size,
      activeNonces: Array.from(this.store.values()).filter(entry => !entry.used && Date.now() <= entry.expiresAt).length,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Export singleton instance
export const nonceStore = new NonceStore();

// Cleanup on process exit
process.on('SIGINT', () => {
  nonceStore.destroy();
});

process.on('SIGTERM', () => {
  nonceStore.destroy();
});
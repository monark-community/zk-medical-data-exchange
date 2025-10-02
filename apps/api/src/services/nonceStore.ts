import logger from '@/utils/logger';

interface NonceEntry {
  walletAddress: string;
  issuedAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * In-memory nonce store for Web3 authentication
 * TODO : replace with Redis cache system (more secure for production)
 */
class NonceStore {
  private store = new Map<string, NonceEntry>();
  private readonly NONCE_EXPIRY_MS = 5 * 60 * 1000;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  setNonce(nonce: string, walletAddress: string): void {
    const now = Date.now();
    this.store.set(nonce, {
      walletAddress: walletAddress.toLowerCase(),
      issuedAt: now,
      expiresAt: now + this.NONCE_EXPIRY_MS,
      used: false,
    });

    logger.info({ nonce, walletAddress }, 'Nonce stored');
  }

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

    entry.used = true;
    logger.debug({ nonce, walletAddress }, 'Nonce validated and consumed');
    
    setTimeout(() => {
      this.store.delete(nonce);
    }, 30 * 1000);

    return true;
  }

  isValidNonce(nonce: string, walletAddress: string): boolean {
    const entry = this.store.get(nonce);
    
    if (!entry) return false;
    if (entry.used) return false;
    if (Date.now() > entry.expiresAt) return false;
    if (entry.walletAddress !== walletAddress.toLowerCase()) return false;

    return true;
  }

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

  getStats() {
    return {
      totalNonces: this.store.size,
      activeNonces: Array.from(this.store.values()).filter(entry => !entry.used && Date.now() <= entry.expiresAt).length,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export const nonceStore = new NonceStore();

process.on('SIGINT', () => {
  nonceStore.destroy();
});

process.on('SIGTERM', () => {
  nonceStore.destroy();
});
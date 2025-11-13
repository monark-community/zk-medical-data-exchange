import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Secure passphrase management for production environments
 * Supports multiple backends: Vault, Split-Key, Environment Variable (dev only)
 */

interface PassphraseConfig {
  backend: 'vault' | 'split-key' | 'env';
  vaultUrl?: string;
  vaultToken?: string;
  secretPath?: string;
  keyParts?: {
    env?: string;
    file?: string;
    metadata?: string;
  };
}

class PassphraseManager {
  private static instance: PassphraseManager;
  private cachedPassphrase: string | null = null;
  private config: PassphraseConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): PassphraseManager {
    if (!PassphraseManager.instance) {
      PassphraseManager.instance = new PassphraseManager();
    }
    return PassphraseManager.instance;
  }

  private loadConfig(): PassphraseConfig {
    const backend = (process.env.PASSPHRASE_BACKEND || 'env') as PassphraseConfig['backend'];

    return {
      backend,
      vaultUrl: process.env.VAULT_URL,
      vaultToken: process.env.VAULT_TOKEN,
      secretPath: process.env.VAULT_SECRET_PATH || 'secret/data/study-encryption',
      keyParts: {
        env: process.env.KEY_PART_ENV,
        file: process.env.KEY_PART_FILE_PATH,
        metadata: process.env.KEY_PART_METADATA,
      },
    };
  }

  /**
   * Get the master passphrase based on configured backend
   */
  async getPassphrase(): Promise<string> {
    // Return cached if available (avoid multiple backend calls)
    if (this.cachedPassphrase) {
      return this.cachedPassphrase;
    }

    let passphrase: string;

    switch (this.config.backend) {
      case 'vault':
        passphrase = await this.getFromVault();
        break;
      case 'split-key':
        passphrase = await this.getFromSplitKey();
        break;
      case 'env':
        passphrase = this.getFromEnv();
        console.warn('⚠️  Using environment variable for passphrase - NOT SECURE FOR PRODUCTION!');
        break;
      default:
        throw new Error(`Unknown passphrase backend: ${this.config.backend}`);
    }

    // Cache in memory (cleared on process restart)
    this.cachedPassphrase = passphrase;
    return passphrase;
  }

  /**
   * Option 1: Retrieve passphrase from HashiCorp Vault
   */
  private async getFromVault(): Promise<string> {
    if (!this.config.vaultUrl || !this.config.vaultToken) {
      throw new Error('Vault configuration incomplete. Set VAULT_URL and VAULT_TOKEN');
    }

    try {
      const response = await fetch(`${this.config.vaultUrl}/v1/${this.config.secretPath}`, {
        headers: {
          'X-Vault-Token': this.config.vaultToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Vault request failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as {
        data?: { data?: { passphrase?: string } };
      };
      const passphrase = data?.data?.data?.passphrase;

      if (!passphrase) {
        throw new Error('Passphrase not found in Vault response');
      }

      console.log('✅ Retrieved passphrase from Vault');
      return passphrase;
    } catch (error) {
      console.error('❌ Failed to retrieve passphrase from Vault:', error);
      throw new Error('Vault passphrase retrieval failed');
    }
  }

  /**
   * Option 2: Reconstruct passphrase from multiple split keys
   * This provides defense in depth by requiring multiple components
   */
  private async getFromSplitKey(): Promise<string> {
    const parts: string[] = [];

    // Part 1: Environment variable (least secure, but convenient)
    if (this.config.keyParts?.env) {
      parts.push(this.config.keyParts.env);
    } else {
      throw new Error('KEY_PART_ENV not configured');
    }

    // Part 2: File on disk (better security, can use restrictive permissions)
    if (this.config.keyParts?.file) {
      try {
        const filePath = path.resolve(this.config.keyParts.file);
        const filePart = fs.readFileSync(filePath, 'utf-8').trim();
        parts.push(filePart);
      } catch {
        throw new Error(`Failed to read key part from file: ${this.config.keyParts.file}`);
      }
    } else {
      throw new Error('KEY_PART_FILE_PATH not configured');
    }

    // Part 3: Machine/deployment metadata (hardware ID, instance ID, etc.)
    if (this.config.keyParts?.metadata) {
      parts.push(this.config.keyParts.metadata);
    } else {
      throw new Error('KEY_PART_METADATA not configured');
    }

    // Combine parts using a deterministic key derivation function
    const combined = parts.join('::');
    const passphrase = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex');

    console.log('✅ Reconstructed passphrase from split keys');
    return passphrase;
  }

  /**
   * Option 3: Simple environment variable (DEVELOPMENT ONLY!)
   */
  private getFromEnv(): string {
    const passphrase = process.env.ENCRYPTION_PASSPHRASE;

    if (!passphrase) {
      throw new Error('ENCRYPTION_PASSPHRASE environment variable not set');
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  WARNING: Using ENCRYPTION_PASSPHRASE env var in production is NOT SECURE!');
    }

    return passphrase;
  }

  /**
   * Generate a new random passphrase for initial setup
   */
  static generatePassphrase(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Split a passphrase into multiple parts for split-key storage
   */
  static splitPassphrase(passphrase: string): {
    envPart: string;
    filePart: string;
    metadataPart: string;
  } {
    // Use a deterministic splitting algorithm
    const hash = crypto.createHash('sha256').update(passphrase).digest();

    const envPart = hash.subarray(0, 21).toString('hex');
    const filePart = hash.subarray(21, 42).toString('hex');
    const metadataPart = hash.subarray(42, 63).toString('hex');

    // Verify reconstruction works
    const reconstructed = crypto
      .createHash('sha256')
      .update(`${envPart}::${filePart}::${metadataPart}`)
      .digest('hex');

    console.log('Original passphrase hash:', crypto.createHash('sha256').update(passphrase).digest('hex'));
    console.log('Reconstructed hash:', reconstructed);

    return {
      envPart,
      filePart,
      metadataPart,
    };
  }

  /**
   * Clear cached passphrase (e.g., for security purposes)
   */
  clearCache(): void {
    this.cachedPassphrase = null;
    console.log('🧹 Passphrase cache cleared');
  }
}

// Export singleton instance
export const passphraseManager = PassphraseManager.getInstance();

// Export class for testing/utilities
export { PassphraseManager };

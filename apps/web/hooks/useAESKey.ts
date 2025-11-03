/**
 * AES Key Management Hook
 * Provides a clean interface for managing encrypted storage keys
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getAESKey, addAESKeyToStore } from "@/services/storage";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { generateAESKey } from "@/utils/encryption";

export function useAESKey(account: ReturnType<typeof useAccount>) {
  const { address, isConnected } = account;
  const [aesKey, setAESKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize key from cache or request new one
  const initializeKey = async (forceRefresh = false) => {
    if (isLoading || !isConnected || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try cached key first (unless forcing refresh)
      const cachedKey = getAESKey(address);
      if (!forceRefresh && cachedKey) {
        setAESKey(cachedKey);
        setIsLoading(false);
        return cachedKey;
      }

      // Request new signature and generate key
      const walletKey = await deriveKeyFromWallet();
      const newKey = generateAESKey(walletKey);

      setAESKey(newKey);
      addAESKeyToStore(newKey, address);
      setIsLoading(false);

      return newKey;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate AES key";
      console.error("AES key initialization failed:", err);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Auto-initialize when wallet connects or address changes
  useEffect(() => {
    if (isConnected && address) {
      initializeKey();
    } else {
      // Clear key when wallet disconnects
      setAESKey(null);
      setError(null);
    }
  }, [isConnected, address]);

  return {
    aesKey,
    isLoading,
    error,
    hasKey: aesKey !== null,
  };
}

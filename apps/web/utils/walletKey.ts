import { BrowserProvider } from "ethers";
import crypto from "crypto";

/**
 * Derive a symmetric AES key from a wallet signature.
 * This key will always be the same for the same wallet.
 */
export const deriveKeyFromWallet = async (): Promise<Buffer> => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const message = "Generate AES key for encryption";

  const signature = await signer.signMessage(message);

  // Hash the signature to get a 32-byte AES key
  const aesKey = crypto.createHash("sha256").update(signature).digest();
  return aesKey;
};

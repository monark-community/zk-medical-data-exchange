import { BrowserProvider } from "ethers";
import crypto from "crypto";

// This is needed to access the Ethereum provider injected by MetaMask without TypeScript errors
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      // eslint-disable-next-line no-unused-vars
      request: (...args: any[]) => Promise<any>;
      // eslint-disable-next-line no-unused-vars
      on: (...args: any[]) => void;
    };
  }
}

/**
 * Derive a symmetric AES key from a wallet signature.
 * This key will always be the same for the same wallet.
 *
 * @returns {Promise<Buffer>} A promise that resolves to a 32-byte AES key.
 */
export const deriveKeyFromWallet = async (): Promise<Buffer> => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // get address (public wallet id)
  const address = await signer.getAddress();
  console.log("Wallet address:", address);
  const message = "Generate AES key for encryption";
  const signature = await signer.signMessage(message);

  // Hash the signature to get a 32-byte AES key
  const aesKey = crypto.createHash("sha256").update(signature).digest();
  return aesKey;
};

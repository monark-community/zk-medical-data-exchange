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

  const address = await signer.getAddress();

   

  const timestamp = Date.now();
  const message = `App: Cura

Timestamp: ${timestamp}
Wallet: ${address}

Action: Derive AES key. This will not cost any gas.
Note: This signature does not authorize any transactions.
`;


  const signature = await signer.signMessage(message);

  const aesKey = crypto.createHash("sha256").update(signature).digest();
  return aesKey;
};

/**
 * Ethereum address utilities
 */

export const isValidEthereumAddress = (address: unknown): address is string => {
  if (!address || typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default isValidEthereumAddress;

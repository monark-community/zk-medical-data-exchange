/**
 * Ethereum address utilities
 */

/**
 * Validates an Ethereum address (simple checksum-agnostic regex)
 * Accepts 0x-prefixed 40-hex-character addresses.
 */
export const isValidEthereumAddress = (address: unknown): address is string => {
  if (!address || typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default isValidEthereumAddress;

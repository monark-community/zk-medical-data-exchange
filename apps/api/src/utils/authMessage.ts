export interface AuthMessageData {
  appName: string;
  walletAddress: string;
  nonce: string;
  issuedAt: string;
  domain?: string;
  uri?: string;
}

export function generateAuthMessage(data: AuthMessageData): string {
  const { appName, walletAddress, nonce, issuedAt, domain, uri } = data;
  
  const structuredData = {
    appName,
    walletAddress,
    nonce,
    issuedAt,
    ...(domain && { domain }),
    ...(uri && { uri }),
  };

  return `Welcome to ${appName}!

    Please sign this message to authenticate with your wallet.
    This signature will not trigger any blockchain transaction or cost any gas fees.

    --- AUTH DATA ---
    ${JSON.stringify(structuredData, null, 2)}
    --- END AUTH DATA ---

    By signing this message, you are securely authenticating your wallet with ${appName}.`;
}

export function parseAuthMessage(message: string): AuthMessageData | null {
  try {
    const startMarker = '--- AUTH DATA ---';
    const endMarker = '--- END AUTH DATA ---';
    
    const startIndex = message.indexOf(startMarker);
    const endIndex = message.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      return null;
    }
    
    const jsonStr = message.slice(startIndex + startMarker.length, endIndex).trim();
    const data = JSON.parse(jsonStr) as AuthMessageData;
    
    if (!data.appName || !data.walletAddress || !data.nonce || !data.issuedAt) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

export function validateAuthMessage(
  parsedMessage: AuthMessageData,
  expectedWalletAddress: string,
  expectedNonce: string,
  maxAgeMs: number = 5 * 60 * 1000
): { isValid: boolean; error?: string } {

  if (parsedMessage.walletAddress.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
    return { isValid: false, error: 'Wallet address mismatch' };
  }

  if (parsedMessage.nonce !== expectedNonce) {
    return { isValid: false, error: 'Nonce mismatch' };
  }

  const issuedAt = new Date(parsedMessage.issuedAt);
  const now = new Date();
  
  if (isNaN(issuedAt.getTime())) {
    return { isValid: false, error: 'Invalid timestamp format' };
  }

  const ageMs = now.getTime() - issuedAt.getTime();
  if (ageMs > maxAgeMs) {
    return { isValid: false, error: 'Message too old' };
  }

  if (ageMs < -60000) {
    return { isValid: false, error: 'Message from future (clock skew)' };
  }

  return { isValid: true };
}

export function generateJsonAuthMessage(data: AuthMessageData): string {
  const message = {
    type: 'AUTH_REQUEST',
    version: '1.0',
    app: data.appName,
    wallet: data.walletAddress,
    nonce: data.nonce,
    timestamp: data.issuedAt,
    domain: data.domain,
    uri: data.uri,
    humanReadable: `Welcome to ${data.appName}! Please sign this message to authenticate your wallet (${data.walletAddress}) with nonce ${data.nonce}. This will not cost any gas fees.`
  };
  
  return JSON.stringify(message, null, 2);
}

export function parseJsonAuthMessage(message: string): AuthMessageData | null {
  try {
    const parsed = JSON.parse(message);
    
    if (parsed.type !== 'AUTH_REQUEST' || !parsed.version || !parsed.app || !parsed.wallet || !parsed.nonce || !parsed.timestamp) {
      return null;
    }
    
    return {
      appName: parsed.app,
      walletAddress: parsed.wallet,
      nonce: parsed.nonce,
      issuedAt: parsed.timestamp,
      domain: parsed.domain,
      uri: parsed.uri,
    };
  } catch {
    return null;
  }
}

export const AUTH_CONFIG = {
  APP_NAME: 'Cura',
  MAX_MESSAGE_AGE_MS: 5 * 60 * 1000,
  CLOCK_SKEW_TOLERANCE_MS: 60 * 1000,
} as const;
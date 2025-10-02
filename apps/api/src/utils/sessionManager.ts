import jwt from "jsonwebtoken";
import type { Web3AuthUser } from "../middleware/web3AuthMiddleware";
import { Config } from "../config/config";
import logger from "./logger";

// Session duration: 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_SECRET = Config.SESSION_SECRET;

logger.debug({ sessionDuration: SESSION_DURATION }, "Session manager initialized");

export interface SessionData {
  userId: string;
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate a session token from Web3Auth user data
 * This creates your application's own JWT session token
 */
export function generateSessionToken(web3AuthUser: Web3AuthUser): string {
  logger.debug({ userId: web3AuthUser.sub }, "Generating session token");
  
  const now = Date.now();
  const walletAddress = web3AuthUser.wallets[0]?.address || "";

  const sessionData: SessionData = {
    userId: web3AuthUser.sub,
    walletAddress,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  logger.debug({ 
    userId: sessionData.userId,
    walletAddress: sessionData.walletAddress,
    expiresAt: new Date(sessionData.expiresAt).toISOString()
  }, "Session data prepared, signing token");

  // Sign the session token with your own secret
  const token = jwt.sign(sessionData, SESSION_SECRET, {
    expiresIn: "7d",
  });

  logger.info({ userId: sessionData.userId }, "Session token generated successfully");

  return token;
}

/**
 * Verify a session token
 * Returns the session data if valid, null if invalid
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    logger.debug("Verifying session token");
    
    const decoded = jwt.verify(token, SESSION_SECRET) as SessionData;
    
    logger.debug({ 
      userId: decoded.userId,
      expiresAt: new Date(decoded.expiresAt).toISOString()
    }, "Token decoded successfully");
    
    // Check if session has expired
    if (decoded.expiresAt < Date.now()) {
      logger.warn({ 
        userId: decoded.userId,
        expiresAt: new Date(decoded.expiresAt).toISOString()
      }, "Session token has expired");
      return null;
    }

    logger.debug({ userId: decoded.userId }, "Session token verified successfully");
    return decoded;
  } catch (error) {
    logger.error({ error }, "Session token verification failed");
    return null;
  }
}

/**
 * Check if a session token is expired
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  return sessionData.expiresAt < Date.now();
}

/**
 * Refresh a session token
 * Creates a new token with extended expiration
 */
export function refreshSessionToken(sessionData: SessionData): string {
  logger.debug({ userId: sessionData.userId }, "Refreshing session token");
  
  const now = Date.now();
  
  const newSessionData: SessionData = {
    ...sessionData,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  logger.debug({ 
    userId: newSessionData.userId,
    newExpiresAt: new Date(newSessionData.expiresAt).toISOString()
  }, "Creating refreshed token");

  const token = jwt.sign(newSessionData, SESSION_SECRET, {
    expiresIn: "7d",
  });

  logger.info({ userId: sessionData.userId }, "Session token refreshed successfully");

  return token;
}

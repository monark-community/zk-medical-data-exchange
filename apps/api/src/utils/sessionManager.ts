import jwt from "jsonwebtoken";
import type { Web3AuthUser } from "@/middleware/web3AuthMiddleware";
import { Config } from "@/config/config";
import logger from "./logger";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
const SESSION_SECRET = Config.SESSION_SECRET;

logger.debug({ sessionDuration: SESSION_DURATION }, "Session manager initialized");

export interface SessionData {
  userId: string;
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
}

export function generateSessionToken(web3AuthUser: Web3AuthUser): string {
  logger.debug({ userId: web3AuthUser.sub }, "Generating session token");
  
  const now = Date.now();
  const walletAddress = web3AuthUser.wallets?.[0]?.address ?? "";

  const sessionData: SessionData = {
    userId: web3AuthUser.sub ?? "",
    walletAddress,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  logger.debug({ 
    userId: sessionData.userId,
    walletAddress: sessionData.walletAddress,
    expiresAt: new Date(sessionData.expiresAt).toISOString()
  }, "Session data prepared, signing token");

  const token = jwt.sign(sessionData, SESSION_SECRET, {
    expiresIn: "7d",
  });

  logger.info({ userId: sessionData.userId }, "Session token generated successfully");

  return token;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    logger.debug("Verifying session token");
    
    const decoded = jwt.verify(token, SESSION_SECRET) as SessionData;
    
    logger.debug({ 
      userId: decoded.userId,
      expiresAt: new Date(decoded.expiresAt).toISOString()
    }, "Token decoded successfully");
    
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

export function isSessionExpired(sessionData: SessionData): boolean {
  return sessionData.expiresAt < Date.now();
}

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

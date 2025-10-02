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
import type { Request, Response } from "express";
import { generateSessionToken } from "@/utils/sessionManager";
import logger from "@/utils/logger";

export async function verifyAuthentication(req: Request, res: Response): Promise<void> {
  try {
    logger.info("Authentication verification endpoint called");
    
    const web3AuthUser = req.web3AuthUser;

    if (!web3AuthUser) {
      logger.error("Web3AuthUser not found in request after middleware verification");
      res.status(401).json({
        error: "Unauthorized",
        message: "User data not found",
      });
      return;
    }

    logger.debug({ 
      userId: web3AuthUser.sub,
      hasWallets: (web3AuthUser.wallets ?? []).length > 0
    }, "Generating session token for user");

    const sessionToken = generateSessionToken(web3AuthUser);

    const walletAddress = (web3AuthUser.wallets ?? [])[0]?.address || "";

    logger.info({ 
      userId: web3AuthUser.sub,
      walletAddress
    }, "Session created successfully");

    res.status(200).json({
      success: true,
      sessionToken,
      userId: web3AuthUser.sub,
      walletAddress,
    });
  } catch (error) {
    logger.error({ error }, "Authentication verification error");
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create session",
    });
  }
}
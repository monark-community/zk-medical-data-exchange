import type { Request, Response } from "express";
import { generateSessionToken } from "@/utils/sessionManager";
import logger from "@/utils/logger";
import { checkIfUserExists, createUser } from "@/services/userService";
import { auditService } from "@/services/auditService";

export async function verifyAuthentication(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const userAgent = req.get("User-Agent") || "";
  const ipAddress = req.ip || req.socket?.remoteAddress || "";
  let walletAddress = "";

  try {
    logger.info("Authentication verification endpoint called");

    const web3AuthUser = req.web3AuthUser;
    if (!web3AuthUser) {
      logger.error("Web3AuthUser not found in request after middleware verification");
      // Log failed authentication attempt (non-blocking)
      auditService
        .logAuthentication("unknown", false, {
          reason: "missing_web3auth_user",
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log authentication audit event");
        });

      res.status(401).json({
        error: "Unauthorized",
        message: "User data not found",
      });
      return;
    }

    logger.debug(
      {
        hasWallets: (web3AuthUser.wallets ?? []).length > 0,
      },
      "Generating session token for user"
    );

    const sessionToken = generateSessionToken(web3AuthUser);

    walletAddress = (web3AuthUser.wallets ?? [])[0]?.address || "";

    const isUserCreated = await checkIfUserExists(req, res, walletAddress);
    if (!isUserCreated) {
      await createUser(req, res, walletAddress);
    }
    // Log successful authentication (non-blocking)
    auditService
      .logAuthentication(walletAddress, true, {
        userAgent,
        ipAddress,
        sessionTokenGenerated: true,
        userCreated: !isUserCreated,
        duration: Date.now() - startTime,
      })
      .catch((error) => {
        logger.error({ error }, "Failed to log successful authentication audit event");
      });

    logger.info(
      {
        walletAddress,
      },
      "Session created successfully"
    );

    res.status(200).json({
      success: true,
      sessionToken,
      walletAddress,
    });
  } catch (error) {
    logger.error({ error }, "Authentication verification error");

    // Log failed authentication attempt (non-blocking)
    auditService
      .logAuthentication(walletAddress || "unknown", false, {
        error: error instanceof Error ? error.message : "unknown_error",
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      })
      .catch((auditError) => {
        logger.error({ auditError }, "Failed to log authentication audit event");
      });

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create session",
    });
  }
}

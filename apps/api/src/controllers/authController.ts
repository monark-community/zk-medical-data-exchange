import type { Request, Response } from "express";
import { generateSessionToken, verifySessionToken } from "../utils/sessionManager";
import logger from "../utils/logger";

/**
 * POST /api/auth/verify
 * Verify Web3Auth JWT token and create session
 * 
 * The Web3Auth token is already verified by the web3AuthMiddleware
 * This endpoint creates a session and returns user data
 */
export async function verifyAuthentication(req: Request, res: Response): Promise<void> {
  try {
    logger.info("Authentication verification endpoint called");
    
    // Token is already verified by middleware, user data is in req.web3AuthUser
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
      verifier: web3AuthUser.verifier,
      hasWallets: web3AuthUser.wallets?.length > 0
    }, "Generating session token for user");

    // Generate session token for your application
    const sessionToken = generateSessionToken(web3AuthUser);

    // Extract wallet address (first wallet)
    const walletAddress = web3AuthUser.wallets[0]?.address || "";

    logger.info({ 
      userId: web3AuthUser.sub,
      walletAddress,
      email: web3AuthUser.email,
      verifier: web3AuthUser.verifier
    }, "Session created successfully");

    // Return user data and session token
    res.status(200).json({
      success: true,
      sessionToken,
      userId: web3AuthUser.sub,
      walletAddress,
      email: web3AuthUser.email,
      name: web3AuthUser.name,
      verifier: web3AuthUser.verifier,
      verifierId: web3AuthUser.verifierId,
    });
  } catch (error) {
    logger.error({ error }, "Authentication verification error");
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create session",
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refresh session token
 */
export async function refreshSession(req: Request, res: Response): Promise<void> {
  try {
    logger.info("Session refresh endpoint called");
    
    const { sessionToken } = req.body;

    if (!sessionToken) {
      logger.warn("Session refresh called without token");
      res.status(400).json({
        error: "Bad request",
        message: "Session token required",
      });
      return;
    }

    logger.debug("Verifying existing session token");
    
    // Verify the current session token
    const sessionData = verifySessionToken(sessionToken);

    if (!sessionData) {
      logger.warn("Invalid or expired session token provided for refresh");
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session",
      });
      return;
    }

    logger.debug({ userId: sessionData.userId }, "Generating new session token");
    
    // Generate new session token
    const { refreshSessionToken } = await import("../utils/sessionManager");
    const newSessionToken = refreshSessionToken(sessionData);

    logger.info({ userId: sessionData.userId }, "Session refreshed successfully");

    res.status(200).json({
      success: true,
      sessionToken: newSessionToken,
      userId: sessionData.userId,
      walletAddress: sessionData.walletAddress,
    });
  } catch (error) {
    logger.error({ error }, "Session refresh error");
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to refresh session",
    });
  }
}

/**
 * POST /api/auth/logout
 * Invalidate session (client-side removal)
 */
export async function logout(req: Request, res: Response): Promise<void> {
  logger.info("Logout endpoint called");
  
  // Since we're using JWT tokens, logout is primarily handled client-side
  // by removing the token from storage
  // In a production system, you might want to implement a token blacklist

  logger.debug("User logged out (client-side token removal)");

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

/**
 * GET /api/auth/me
 * Get current user information from session token
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    logger.info("Get current user endpoint called");
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Get current user called without authorization header");
      res.status(401).json({
        error: "Unauthorized",
        message: "No session token provided",
      });
      return;
    }

    const sessionToken = authHeader.substring(7);
    logger.debug("Verifying session token for current user");
    
    const sessionData = verifySessionToken(sessionToken);

    if (!sessionData) {
      logger.warn("Invalid or expired session token for get current user");
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session",
      });
      return;
    }

    logger.info({ userId: sessionData.userId, walletAddress: sessionData.walletAddress }, "Current user retrieved successfully");

    res.status(200).json({
      success: true,
      userId: sessionData.userId,
      walletAddress: sessionData.walletAddress,
      email: sessionData.email,
      name: sessionData.name,
      verifier: sessionData.verifier,
      verifierId: sessionData.verifierId,
    });
  } catch (error) {
    logger.error({ error }, "Get current user error");
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user information",
    });
  }
}

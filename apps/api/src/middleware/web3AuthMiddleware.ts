import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { Config } from "../config/config";
import logger from "../utils/logger";

// Web3Auth JWKS endpoint
const WEB3AUTH_JWKS_URI = "https://api-auth.web3auth.io/jwks";
const WEB3AUTH_ISSUER = "https://api-auth.web3auth.io";

logger.info({ jwksUri: WEB3AUTH_JWKS_URI, issuer: WEB3AUTH_ISSUER }, "Web3Auth middleware initialized");

// Create JWKS client
const client = jwksClient({
  jwksUri: WEB3AUTH_JWKS_URI,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Function to get the signing key
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  logger.debug({ kid: header.kid }, "Fetching signing key from JWKS endpoint");
  
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error({ error: err, kid: header.kid }, "Failed to fetch signing key");
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    logger.debug({ kid: header.kid }, "Successfully fetched signing key");
    callback(null, signingKey);
  });
}

export interface Web3AuthUser {
  sub: string; // User ID
  email?: string;
  name?: string;
  profileImage?: string;
  verifier: string;
  verifierId: string;
  wallets: Array<{
    type: string;
    address: string;
    public_key: string;
  }>;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Extend Express Request to include web3AuthUser
declare global {
  namespace Express {
    interface Request {
      web3AuthUser?: Web3AuthUser;
    }
  }
}

/**
 * Middleware to verify Web3Auth JWT tokens
 * Verifies the token signature using Web3Auth's JWKS endpoint
 */
export function verifyWeb3AuthToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.info({ method: req.method, path: req.path }, "Web3Auth token verification started");
  
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({ method: req.method, path: req.path }, "No authorization header or invalid format");
    res.status(401).json({
      error: "Unauthorized",
      message: "No token provided",
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const tokenPreview = token.substring(0, 20) + "...";
  
  logger.debug({ tokenPreview }, "Extracted Bearer token");

  // Get Web3Auth Client ID from config
  const clientId = Config.WEB3AUTH_CLIENT_ID;
  
  logger.debug({ 
    clientId: clientId.substring(0, 10) + "...",
    issuer: WEB3AUTH_ISSUER,
    algorithm: "ES256"
  }, "Verifying token with configuration");

  // Verify the token
  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["ES256"],
      audience: clientId,
      issuer: WEB3AUTH_ISSUER,
    },
    (err, decoded) => {
      if (err) {
        logger.error({ 
          error: err.message, 
          name: err.name,
          tokenPreview 
        }, "Token verification failed");
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token",
          details: err.message,
        });
        return;
      }

      const user = decoded as Web3AuthUser;
      logger.info({ 
        userId: user.sub,
        verifier: user.verifier,
        walletAddress: user.wallets?.[0]?.address,
        email: user.email
      }, "Token verified successfully");

      // Attach decoded user info to request
      req.web3AuthUser = user;
      next();
    }
  );
}

/**
 * Optional middleware - only verifies if token is present
 * Useful for routes that work with or without authentication
 */
export function optionalWeb3AuthToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided, continue without authentication
    next();
    return;
  }

  // Token provided, verify it
  verifyWeb3AuthToken(req, res, next);
}

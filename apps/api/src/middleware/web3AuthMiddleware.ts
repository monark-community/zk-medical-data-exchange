import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import type { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";
import { Config } from "@/config/config";

const METAMASK_JWKS_URI = "https://authjs.web3auth.io/jwks";

const client = jwksClient({
  jwksUri: METAMASK_JWKS_URI,
});

function getKey(header: any, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err: Error | null, key?: jwksClient.SigningKey) => {
    if (err) {
      logger.error({ error: err }, "Failed to get signing key from AuthJS");
      callback(err);
      return;
    }
    const signingKey = key!.getPublicKey();
    callback(null, signingKey);
  });
}

export interface Web3AuthUser {
  iss: string;
  aud: string;
  sub?: string;
  exp: number;
  iat: number;
  wallets?: Array<{
    address: string;
    type: string;
  }>;
}

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      web3AuthUser?: Web3AuthUser;
    }
  }
}

export function verifyWeb3AuthToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("No authorization header or invalid format");
    res.status(401).json({
      error: "Unauthorized",
      message: "No valid authorization token provided",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    logger.warn("No token found in authorization header");
    res.status(401).json({
      error: "Unauthorized",
      message: "No token provided",
    });
    return;
  }

  let decodedPreview: { header: jwt.JwtHeader; payload: Web3AuthUser } | null;
  try {
    decodedPreview = jwt.decode(token, { complete: true }) as {
      header: jwt.JwtHeader;
      payload: Web3AuthUser;
    } | null;

    logger.debug(
      {
        issuer: decodedPreview?.payload?.iss,
        audience: decodedPreview?.payload?.aud,
      },
      "Token preview"
    );
  } catch (decodeErr) {
    logger.error({ error: decodeErr }, "Failed to decode token");
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token format",
    });
    return;
  }

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["ES256"],
    },
    (err, decoded) => {
      if (err) {
        logger.error(
          {
            error: err.message,
            tokenPreview: token.substring(0, 20) + "...",
          },
          "JWT verification failed"
        );

        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or expired token",
        });
        return;
      }

      if (!decoded || typeof decoded === "string") {
        logger.error("Invalid token payload");
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token payload",
        });
        return;
      }

      const web3AuthUser = decoded as Web3AuthUser;

      if (web3AuthUser.iss !== "metamask") {
        logger.error(
          {
            issuer: web3AuthUser.iss,
            expected: "metamask",
          },
          "Invalid issuer - only MetaMask is supported"
        );

        res.status(401).json({
          error: "Unauthorized",
          message: "Only MetaMask authentication is supported",
        });
        return;
      }

      if (
        !web3AuthUser.wallets ||
        web3AuthUser.wallets.length === 0 ||
        !web3AuthUser.wallets[0]?.address
      ) {
        logger.error("No wallet found in token");
        res.status(401).json({
          error: "Unauthorized",
          message: "No wallet address in token",
        });
        return;
      }

      const allowedAudiences = Config.IS_LOCAL_MODE
        ? ["localhost", "127.0.0.1"]
        : ["cura-web.onrender.com"];

      const isValidAudience = allowedAudiences.some((allowed) => {
        const aud = web3AuthUser.aud?.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const allowedClean = allowed.replace(/^https?:\/\//, "").replace(/\/$/, "");
        return aud === allowedClean || aud?.includes(allowedClean);
      });

      if (!isValidAudience) {
        logger.error(
          {
            audience: web3AuthUser.aud,
            allowedAudiences,
            isLocal: Config.IS_LOCAL_MODE,
          },
          "Invalid audience - token not from allowed origin"
        );

        res.status(401).json({
          error: "Unauthorized",
          message: "Token from unauthorized origin",
        });
        return;
      }

      const walletAddress = web3AuthUser.wallets[0].address;
      const walletType = web3AuthUser.wallets[0].type;

      logger.info(
        {
          walletAddress,
          walletType,
          issuer: web3AuthUser.iss,
          audience: web3AuthUser.aud,
        },
        "MetaMask JWT verification successful"
      );

      req.web3AuthUser = web3AuthUser;
      next();
    }
  );
}

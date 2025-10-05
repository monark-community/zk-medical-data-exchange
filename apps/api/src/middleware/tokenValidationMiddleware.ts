import jwt from "jsonwebtoken";
import { Config } from "@/config/config";
import type { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";

export function verifySessionToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    logger.warn("No session token provided");
    res.status(401).json({ error: "Unauthorized", message: "Missing session token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, Config.SESSION_SECRET);
    logger.debug({ decoded }, "Session token verified successfully");
    next();
  } catch (err) {
    logger.error({ err }, "Session token verification failed");
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session token" });
  }
}

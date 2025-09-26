import type { Request, Response, NextFunction } from "express";
import { Config } from "@/config/config";

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const appApiKey = req.headers["x-api-key"];
  if (!appApiKey || appApiKey !== Config.APP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

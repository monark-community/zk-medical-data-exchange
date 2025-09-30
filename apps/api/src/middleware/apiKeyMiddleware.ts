import type { Request, Response, NextFunction } from "express";
import { Config } from "@/config/config";

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('=== API Key Middleware Called ===');
  const appApiKey = req.headers["x-api-key"];
  console.log('Received API Key:', appApiKey ? '***SET***' : 'MISSING');
  console.log('Expected API Key:', Config.APP_API_KEY ? '***SET***' : 'MISSING');
  console.log('Keys match:', appApiKey === Config.APP_API_KEY);
  
  if (!appApiKey || appApiKey !== Config.APP_API_KEY) {
    console.log('Rejecting request with 401');
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  console.log('Allowing request to proceed');
  next();
};

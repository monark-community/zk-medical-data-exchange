import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";

const { USERS } = TABLES;

export async function getUserById(req: Request, res: Response) {
  const { walletAddress } = req.params;
  try {
    logger.info({ walletAddress }, "getUser called");

    const { data, error } = await req.supabase
      .from(USERS!.name!)
      .select("*")
      .eq(USERS!.columns.id!, walletAddress)
      .limit(1)
      .single();

    if (error) {
      logger.error({ error, walletAddress }, "Supabase query error in getUser");
      res.status(500).json({ error: "Database query failed" });
      return null;
    }

    if (!data) {
      logger.info({ walletAddress }, "User not found in getUser");
      return null;
    }

    logger.info({ walletAddress }, "User retrieved successfully");
    return data;
  } catch (err) {
    logger.error({ err, walletAddress }, "Unexpected error in getUser");
    res.status(500).json({ error: "Internal server error" });
    return null;
  }
}

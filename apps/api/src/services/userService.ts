import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";

const { USERS } = TABLES;

export async function checkIfUserExists(
  req: Request,
  res: Response,
  walletAddress: string
): Promise<boolean> {
  try {
    logger.info({ walletAddress }, "checkIfUserExists called");

    const { data, error } = await req.supabase
      .from(USERS!.name!)
      .select("*")
      .eq(USERS!.columns.id!, walletAddress)
      .limit(1)
      .single();

    if (error) {
      logger.error({ error, walletAddress }, "Supabase query error in checkIfUserExists");
      res.status(500).json({ error: "Database query failed" });
      return false;
    }

    const exists = !!data;
    logger.info({ walletAddress, exists }, "checkIfUserExists result");

    return exists;
  } catch (err) {
    logger.error({ err, walletAddress }, "Unexpected error in checkIfUserExists");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

export async function createUser(
  req: Request,
  res: Response,
  walletAddress: string
): Promise<boolean> {
  try {
    logger.info({ walletAddress }, "createUser called");

    // For simplicity, using walletAddress as username
    // User will be able to change it later in the settings
    const { error } = await req.supabase.from(USERS!.name!).insert({
      [USERS!.columns.id!]: walletAddress,
      [USERS!.columns.username!]: walletAddress,
    });

    if (error) {
      logger.error({ error, walletAddress }, "Supabase insert error in createUser");
      res.status(500).json({ error: "Failed to create user" });
      return false;
    }

    logger.info({ walletAddress }, "User created successfully");
    return true;
  } catch (err) {
    logger.error({ err, walletAddress }, "Unexpected error in createUser");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

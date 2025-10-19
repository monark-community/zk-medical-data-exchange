import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";

const { USERS } = TABLES;

export async function getUserById(req: Request, res: Response) {
  const { walletAddress } = req.params;

  try {
    logger?.info({ walletAddress }, "getUser called");

    const { data, error } = await req.supabase
      .from(USERS!.name!)
      .select("*")
      .eq(USERS!.columns.id!, walletAddress) // or .eq('wallet_address', walletAddress)
      .maybeSingle(); // <- avoids throwing when not found

    if (error) {
      logger?.error({ error, walletAddress }, "Supabase query error in getUser");
      return res.status(500).json({ error: "Database query failed" });
    }

    if (!data) {
      logger?.info({ walletAddress }, "User not found in getUser");
      return res.status(404).json({ error: "User not found" });
    }

    logger?.info({ walletAddress }, "User retrieved successfully");
    // map DB -> API shape if needed
    return res.status(200).json({
      id: data.id,
      username: data.username,
      created_at: data.created_at,
    });
  } catch (err) {
    logger?.error({ err, walletAddress }, "Unexpected error in getUser");
    return res.status(500).json({ error: "Internal server error" });
  }
}

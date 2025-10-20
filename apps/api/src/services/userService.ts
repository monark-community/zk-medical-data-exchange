import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";
import type { SupabaseClient } from "@supabase/supabase-js";

const { USERS } = TABLES;

export type UserRow = {
  id: string;
  username: string | null;
  created_at: string;
};

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

export async function getUserByWalletAddress(
  supabase: SupabaseClient,
  walletAddress: string
): Promise<UserRow | null> {
  // Keep the selection tight; no "*"
  const { data, error } = await supabase
    .from(USERS!.name!)
    .select("id, username, created_at")
    .eq(USERS!.columns.id!, walletAddress)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data ?? null;
}

export async function updateUserByWalletAddress(
  supabase: SupabaseClient,
  walletAddress: string,
  updateData: { username?: string }
): Promise<UserRow | null> {
  // Validate username if provided
  if (updateData.username !== undefined) {
    const username = updateData.username.trim();

    // Validate username format, just in case: 4-10 characters, letters and underscores only
    const usernameRegex = /^[a-zA-Z_]{4,10}$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        "Invalid username format. Must be 4-10 characters long, letters and underscores only."
      );
    }
  }

  // Update the user
  const { data, error } = await supabase
    .from(USERS!.name!)
    .update({
      [USERS!.columns.username!]: updateData.username,
    })
    .eq(USERS!.columns.id!, walletAddress)
    .select("id, username, created_at")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data ?? null;
}

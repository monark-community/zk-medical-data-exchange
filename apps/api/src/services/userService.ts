import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";

const { USERS } = TABLES;

export async function checkIfUserExists(
  req: Request,
  res: Response,
  wallet_address: string
): Promise<boolean> {
  try {
    logger.info({ wallet_address }, "checkIfUserExists called");

    const { data, error } = await req.supabase
      .from(USERS!.name!)
      .select("*")
      .eq(USERS!.columns.id!, wallet_address)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error({ error, wallet_address }, "Supabase query error in checkIfUserExists");
      res.status(500).json({ error: "Database query failed" });
      return false;
    }

    const exists = !!data;
    logger.info({ wallet_address, exists }, "checkIfUserExists result");

    return exists;
  } catch (err) {
    logger.error({ err, wallet_address }, "Unexpected error in checkIfUserExists");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

export async function createUser(
  req: Request,
  res: Response,
  wallet_address: string
): Promise<boolean> {
  try {
    logger.info({ wallet_address }, "createUser called");

    const { error } = await req.supabase.from(USERS!.name!).insert({
      [USERS!.columns.id!]: wallet_address,
    });

    if (error) {
      logger.error({ error, wallet_address }, "Supabase insert error in createUser");
      res.status(500).json({ error: "Failed to create user" });
      return false;
    }

    logger.info({ wallet_address }, "User created successfully");
    return true;
  } catch (err) {
    logger.error({ err, wallet_address }, "Unexpected error in createUser");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

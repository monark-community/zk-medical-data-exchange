import type { Request, Response } from "express";
import { TABLES } from "../constants/db";

const { DATA_VAULT } = TABLES;

export const uploadCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid, record_type } = req.body;

  const insertResult = await req.supabase.from(DATA_VAULT!.name).insert({
    [DATA_VAULT!.columns.walletAddress!]: wallet_address,
    [DATA_VAULT!.columns.encryptedCid!]: encrypted_cid,
    [DATA_VAULT!.columns.recordType!]: record_type,
  });

  if (insertResult.error) {
    return res.status(500).json({ error: insertResult.error.message });
  }

  return res.status(201).json({
    message: "Data uploaded successfully",
    cid: encrypted_cid,
  });
};

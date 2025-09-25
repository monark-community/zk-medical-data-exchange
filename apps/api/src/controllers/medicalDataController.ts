import type { Request, Response } from "express";
import { TABLES } from "@/constants/db";
import logger from "@/utils/logger";

const { DATA_VAULT } = TABLES;

export const uploadCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid, record_type } = req.body;
  logger.info({ wallet_address, record_type }, "uploadCID called");

  const insertResult = await req.supabase.from(DATA_VAULT!.name).insert({
    [DATA_VAULT!.columns.walletAddress!]: wallet_address,
    [DATA_VAULT!.columns.encryptedCid!]: encrypted_cid,
    [DATA_VAULT!.columns.recordType!]: record_type,
  });

  if (insertResult.error) {
    logger.warn({ error: insertResult.error }, "uploadCID insert error");
    return res.status(500).json({ error: insertResult.error.message });
  }

  logger.info("uploadCID success");
  return res.status(201).json({
    message: "Data uploaded successfully",
    cid: encrypted_cid,
  });
};

export const downloadCIDs = async (req: Request, res: Response) => {
  const { wallet_address } = req.query;
  logger.info({ wallet_address }, "downloadCIDs called");

  const selectResult = await req.supabase
    .from(DATA_VAULT!.name)
    .select(
      `${DATA_VAULT!.columns.encryptedCid}, ${DATA_VAULT!.columns.resourceType}, ${
        DATA_VAULT!.columns.createdAt
      }`
    )
    .eq(DATA_VAULT!.columns.walletAddress!, wallet_address);

  if (selectResult.error) {
    logger.warn({ error: selectResult.error }, "downloadCIDs select error");
    return res.status(500).json({ error: selectResult.error.message });
  }

  logger.info("downloadCIDs success");
  return res.status(200).json(selectResult.data);
};

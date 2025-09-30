import type { Request, Response } from "express";
import { TABLES } from "@/constants/db";
import logger from "@/utils/logger";

const { DATA_VAULT } = TABLES;

export const uploadCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid, resource_type } = req.body;
  logger.info({ wallet_address, resource_type }, "uploadCID called");

  const insertResult = await req.supabase.from(DATA_VAULT!.name).insert({
    [DATA_VAULT!.columns.walletAddress!]: wallet_address,
    [DATA_VAULT!.columns.encryptedCid!]: encrypted_cid,
    [DATA_VAULT!.columns.resourceType!]: resource_type,
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

export const deleteCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid } = req.body;
  logger.info({ wallet_address, encrypted_cid }, "deleteCID called");

  const checkResult = await req.supabase
    .from(DATA_VAULT!.name)
    .select(DATA_VAULT!.columns.id!)
    .eq(DATA_VAULT!.columns.walletAddress!, wallet_address)
    .eq(DATA_VAULT!.columns.encryptedCid!, encrypted_cid);

  if (checkResult.error) {
    logger.warn({ error: checkResult.error }, "deleteCID check error");
    return res.status(500).json({ error: checkResult.error.message });
  }

  if (!checkResult.data || checkResult.data.length === 0) {
    logger.warn({ wallet_address, encrypted_cid }, "Record not found to delete");
    return res.status(404).json({ error: "Record not found" });
  }

  const deleteResult = await req.supabase
    .from(DATA_VAULT!.name)
    .delete()
    .eq(DATA_VAULT!.columns.walletAddress!, wallet_address)
    .eq(DATA_VAULT!.columns.encryptedCid!, encrypted_cid);

  if (deleteResult.error) {
    logger.warn({ error: deleteResult.error }, "deleteCID delete error");
    return res.status(500).json({ error: deleteResult.error.message });
  }

  logger.info("deleteCID success");
  return res.status(200).json({ message: "Data deleted successfully" });
};

import type { Request, Response } from "express";
import { TABLES } from "@/constants/db";
import logger from "@/utils/logger";
import { auditService, UserProfile, ActionType } from "@/services/auditService";

const { DATA_VAULT } = TABLES;

export const uploadCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid, resource_type } = req.body;
  const startTime = Date.now();
  const userAgent = req.get("User-Agent") || "";
  const ipAddress = req.ip || req.socket?.remoteAddress || "";

  logger.info({ wallet_address, resource_type }, "uploadCID called");

  try {
    const insertResult = await req.supabase.from(DATA_VAULT!.name).insert({
      [DATA_VAULT!.columns.walletAddress!]: wallet_address,
      [DATA_VAULT!.columns.encryptedCid!]: encrypted_cid,
      [DATA_VAULT!.columns.resourceType!]: resource_type,
    });

    if (insertResult.error) {
      logger.warn({ error: insertResult.error }, "uploadCID insert error");

      // Log failed upload attempt (non-blocking)
      auditService
        .logDataUpload(wallet_address, resource_type || "unknown_file", encrypted_cid, false, {
          resource_type,
          error: insertResult.error.message,
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log audit event for failed upload");
        });

      return res.status(500).json({ error: insertResult.error.message });
    }

    // Log successful upload (non-blocking)
    auditService
      .logDataUpload(
        wallet_address,
        resource_type || "unknown_file", // Use resource_type as filename fallback
        encrypted_cid,
        true,
        {
          resource_type,
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        }
      )
      .catch((error) => {
        logger.error({ error }, "Failed to log audit event for successful upload");
      });

    logger.info("uploadCID success");
    return res.status(201).json({
      message: "Data uploaded successfully",
      cid: encrypted_cid,
    });
  } catch (error) {
    logger.error({ error }, "uploadCID unexpected error");

    // Log failed upload attempt (non-blocking)
    auditService
      .logAction({
        user: wallet_address,
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.DATA_UPLOAD,
        resource: `data_vault`,
        action: "upload_data",
        success: false,
        metadata: {
          resource_type,
          error: error instanceof Error ? error.message : "unknown_error",
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
      })
      .catch((auditError) => {
        logger.error({ auditError }, "Failed to log audit event for upload error");
      });

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const downloadCIDs = async (req: Request, res: Response) => {
  const { wallet_address } = req.query;
  logger.info({ wallet_address }, "downloadCIDs called");

  try {
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
  } catch (error) {
    logger.error({ error }, "downloadCIDs unexpected error");

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCID = async (req: Request, res: Response) => {
  const { wallet_address, encrypted_cid } = req.body;
  const startTime = Date.now();
  const userAgent = req.get("User-Agent") || "";
  const ipAddress = req.ip || req.socket?.remoteAddress || "";

  logger.info({ wallet_address, encrypted_cid }, "deleteCID called");

  try {
    const checkResult = await req.supabase
      .from(DATA_VAULT!.name)
      .select(DATA_VAULT!.columns.id!)
      .eq(DATA_VAULT!.columns.walletAddress!, wallet_address)
      .eq(DATA_VAULT!.columns.encryptedCid!, encrypted_cid);

    if (checkResult.error) {
      logger.warn({ error: checkResult.error }, "deleteCID check error");

      // Log failed data deletion (non-blocking)
      auditService
        .logAction({
          user: wallet_address,
          userProfile: UserProfile.DATA_SELLER,
          actionType: ActionType.DATA_DELETED,
          resource: "data_vault",
          action: "delete_data",
          success: false,
          metadata: {
            phase: "check",
            error: checkResult.error.message,
            userAgent,
            ipAddress,
            duration: Date.now() - startTime,
          },
          sensitiveData: {
            encrypted_cid: encrypted_cid.substring(0, 10) + "...",
          },
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log audit event for delete check error");
        });

      return res.status(500).json({ error: checkResult.error.message });
    }

    if (!checkResult.data || checkResult.data.length === 0) {
      logger.warn({ wallet_address, encrypted_cid }, "Record not found to delete");

      // Log failed data deletion - not found (non-blocking)
      auditService
        .logAction({
          user: wallet_address,
          userProfile: UserProfile.DATA_SELLER,
          actionType: ActionType.DATA_DELETED,
          resource: "data_vault",
          action: "delete_data",
          success: false,
          metadata: {
            reason: "record_not_found",
            userAgent,
            ipAddress,
            duration: Date.now() - startTime,
          },
          sensitiveData: {
            encrypted_cid: encrypted_cid.substring(0, 10) + "...",
          },
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log audit event for record not found");
        });

      return res.status(404).json({ error: "Record not found" });
    }

    const deleteResult = await req.supabase
      .from(DATA_VAULT!.name)
      .delete()
      .eq(DATA_VAULT!.columns.walletAddress!, wallet_address)
      .eq(DATA_VAULT!.columns.encryptedCid!, encrypted_cid);

    if (deleteResult.error) {
      logger.warn({ error: deleteResult.error }, "deleteCID delete error");

      // Log failed data deletion (non-blocking)
      auditService
        .logAction({
          user: wallet_address,
          userProfile: UserProfile.DATA_SELLER,
          actionType: ActionType.DATA_DELETED,
          resource: "data_vault",
          action: "delete_data",
          success: false,
          metadata: {
            phase: "delete",
            error: deleteResult.error.message,
            userAgent,
            ipAddress,
            duration: Date.now() - startTime,
          },
          sensitiveData: {
            encrypted_cid: encrypted_cid.substring(0, 10) + "...",
          },
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log audit event for delete error");
        });

      return res.status(500).json({ error: deleteResult.error.message });
    }

    // Log successful data deletion (non-blocking)
    auditService
      .logDataDeletion(
        wallet_address,
        "data_file", // Generic filename since we don't have the original filename
        encrypted_cid,
        true,
        {
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        }
      )
      .catch((error) => {
        logger.error({ error }, "Failed to log audit event for successful delete");
      });

    logger.info("deleteCID success");
    return res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    logger.error({ error }, "deleteCID unexpected error");

    // Log failed data deletion (non-blocking)
    auditService
      .logAction({
        user: wallet_address,
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.DATA_DELETED,
        resource: "data_vault",
        action: "delete_data",
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : "unknown_error",
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
        sensitiveData: {
          encrypted_cid: encrypted_cid.substring(0, 10) + "...",
        },
      })
      .catch((auditError) => {
        logger.error({ auditError }, "Failed to log audit event for delete unexpected error");
      });

    return res.status(500).json({ error: "Internal server error" });
  }
};

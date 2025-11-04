import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { pinata } from "@/constants/pinata";

export const getPresignedIpfsUrl = async (req: Request, res: Response) => {
  try {
    const expires = Number(req.query.expires ?? 60);
    const mime = (req.query.mime as string) ?? "application/json";
    const maxFileSize = Number(req.query.maxSize ?? 50_000_000);
    const filename = (req.query.filename as string) || undefined;

    const data = {
      expires,
      mimeTypes: [mime],
      maxFileSize,
      ...(filename ? { filename } : {}),
    };
    const url = await pinata.upload.public.createSignedURL(data);

    return res.status(200).json({ url });
  } catch (error: any) {
    const message = error?.message || "Error creating signed URL";
    return res.status(500).json({ error: message });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id in request body" });
    }

    const result = await pinata.files.public.delete([file_id]);
    logger.info({ file_id, result }, "IPFS file deleted successfully");
    return res.status(200).json({
      success: true,
      message: `File with ID ${file_id} deleted successfully.`,
      result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error deleting IPFS file");
    const message =
      error?.response?.data?.error || error?.message || "Error deleting file from Pinata";
    return res.status(500).json({ success: false, error: message });
  }
};

import { apiClient } from "@/services/core/apiClient";
import { Config } from "@/config/config";
import axios from "axios";

const MAX_CACHE_SIZE = 100;
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

interface CacheEntry {
  content: string;
  lastAccessed: number;
}

type UploadResponse = {
  cid: string;
  fileId: string;
};

const contentCache: Record<string, CacheEntry> = {};

/**
 * Manages cache size using LRU (Least Recently Used) eviction
 */
const manageCacheSize = (): void => {
  if (Object.keys(contentCache).length >= MAX_CACHE_SIZE) {
    let lruKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Object.entries(contentCache)) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      delete contentCache[lruKey];
    }
  }
};

export const ipfsUpload = async (file_content: string): Promise<UploadResponse> => {
  try {
    const filename = `data-${Date.now()}.json`;
    const mime = "application/json";
    const presign = await apiClient.get("/ipfs", {
      params: { filename, mime, expires: 60, maxSize: 50_000_000 },
    });

    const signedUrl: string = presign.data?.url;
    if (!signedUrl) throw new Error("Missing signed upload URL");

    const blob = new Blob([file_content], { type: mime });
    const file = new File([blob], filename, { type: mime });
    const formData = new FormData();
    formData.append("file", file);

    const uploadResp = await fetch(signedUrl, { method: "POST", body: formData });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text().catch(() => "");
      throw new Error(errText || `Upload failed with ${uploadResp.status}`);
    }

    const json = await uploadResp.json().catch(() => ({} as any));
    const cid: string = json?.data?.cid;
    const fileId: string = json?.data?.id;

    if (!cid || !fileId) throw new Error("Upload response missing CID or File ID");

    if (file_content.length <= MAX_CONTENT_SIZE) {
      manageCacheSize();
      contentCache[cid] = { content: file_content, lastAccessed: Date.now() };
    }

    return {
      cid,
      fileId,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to upload: ${error?.response?.data?.error || error.message || "Unknown error"}`
    );
  }
};

export const ipfsDownload = async (cid: string): Promise<string> => {
  const cached = contentCache[cid];
  if (cached) {
    cached.lastAccessed = Date.now();
    return cached.content;
  }

  try {
    const url = `https://${Config.PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await axios.get(url);

    const content =
      typeof response.data === "string" ? response.data : JSON.stringify(response.data);

    if (content.length <= MAX_CONTENT_SIZE) {
      manageCacheSize();
      contentCache[cid] = {
        content,
        lastAccessed: Date.now(),
      };
    }

    return content;
  } catch (error: any) {
    console.error("Error downloading from Pinata gateway:", error);
    throw new Error(
      `Failed to download from Pinata gateway: ${
        error?.response?.data?.error || error.message || "Unknown error"
      }`
    );
  }
};

export const ipfsDelete = async (
  cid: string,
  fileId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete("/ipfs", {
      data: { file_id: fileId },
    });

    // Clear cache
    if (contentCache[cid]) {
      delete contentCache[cid];
    }

    const success = Boolean(response.data?.success ?? true);
    const message = response.data?.message || `Successfully deleted CID: ${cid}`;

    return { success, message };
  } catch (error: any) {
    const message = error?.response?.data?.error || error.message || "Unknown error";
    throw new Error(`Failed to delete file: ${message}`);
  }
};

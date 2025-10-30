import { apiClient } from "@/services/core/apiClient";
import { Config } from "@/config/config";
import axios from "axios";

const MAX_CACHE_SIZE = 100;
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

interface CacheEntry {
  content: string;
  lastAccessed: number;
}

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

/**
 * Uploads encrypted content by delegating to your backend API.
 * The backend should persist and return the resulting CID.
 *
 * POST /ipfs/upload
 * body: { file_content: string }
 * res:  { cid: string }
 */
export const ipfsUpload = async (file_content: string): Promise<string> => {
  try {
    const response = await apiClient.post("/ipfs/upload", { file_content });
    const cid: string = response.data?.cid;

    if (!cid) {
      throw new Error("Upload response missing CID");
    }

    // Cache small payloads locally for instant subsequent reads
    if (typeof file_content === "string" && file_content.length <= MAX_CONTENT_SIZE) {
      manageCacheSize();
      contentCache[cid] = {
        content: file_content,
        lastAccessed: Date.now(),
      };
    }

    return cid;
  } catch (error: any) {
    console.error("Error uploading via API:", error);
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

/**
 * Deletes stored content (and any backend mapping) via your API.
 *
 * DELETE /ipfs
 * body: { cid: string }
 * res:  { success: boolean; message?: string }
 */
export const ipfsDelete = async (cid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete("/ipfs", {
      data: { cid },
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

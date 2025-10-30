import { Config } from "@/config/config";
import axios from "axios";

const GATEWAY_URL = "https://violet-added-quelea-543.mypinata.cloud";

const MAX_CACHE_SIZE = 100;
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

export const ipfsApiClient = axios.create({
  headers: {
    Authorization: `Bearer ${Config.PINATA_JWT}`,
  },
});

const setBaseUrlForOperation = (operation: "upload" | "management") => {
  if (operation === "upload") {
    ipfsApiClient.defaults.baseURL = "https://uploads.pinata.cloud/v3";
  } else {
    ipfsApiClient.defaults.baseURL = "https://api.pinata.cloud/v3";
  }
};

export const ipfsGatewayClient = axios.create({
  baseURL: GATEWAY_URL,
});

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
 * Uploads encrypted content to IPFS using the Pinata service with minimal metadata.
 *
 * @param file_content - The encrypted content to be uploaded.
 * @returns A Promise that resolves to the CID (Content Identifier) of the uploaded file.
 * @throws Will throw an error if the upload request fails.
 */
export const ipfsUpload = async (file_content: string): Promise<string> => {
  try {
    setBaseUrlForOperation("upload");

    const randomId = Math.random().toString(36).substring(2, 10);

    const formData = new FormData();
    const blob = new Blob([file_content], { type: "application/json" });

    formData.append("file", blob, `data-${randomId}.json`);
    formData.append("network", "public");
    formData.append("name", `data-${randomId}`);
    formData.append(
      "keyvalues",
      JSON.stringify({
        contentType: "encrypted",
      })
    );

    const response = await ipfsApiClient.post("/files", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const cid = response.data.data.cid;

    if (file_content.length <= MAX_CONTENT_SIZE) {
      manageCacheSize();
      contentCache[cid] = {
        content: file_content,
        lastAccessed: Date.now(),
      };
    }

    return cid;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error(
      `Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Deletes a file from Pinata IPFS storage using the file's CID.
 *
 * @param cid - The IPFS Content Identifier (CID) of the file to delete
 * @returns A Promise that resolves to an object containing success status and message
 * @throws Will throw an error if the file is not found or if deletion fails
 */
export const ipfsDelete = async (cid: string): Promise<{ success: boolean; message: string }> => {
  try {
    setBaseUrlForOperation("management");

    const network = "public"; // We use 'public' for mainnet files

    const searchResponse = await ipfsApiClient.get(`/files/${network}`, {
      params: {
        cid: cid,
        limit: 1,
      },
    });

    const files = searchResponse.data.data.files || [];
    if (files.length === 0) {
      throw new Error(`File with CID ${cid} not found`);
    }

    const fileId = files[0].id;

    await ipfsApiClient.delete(`/files/${network}/${fileId}`);

    if (contentCache[cid]) {
      delete contentCache[cid];
    }

    return {
      success: true,
      message: `Successfully deleted file with CID: ${cid}`,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      if (status === 401 || status === 403) {
        throw new Error("Invalid or insufficient permissions for Pinata JWT token");
      }

      if (status === 404) {
        throw new Error(`File with CID ${cid} not found or already deleted`);
      }

      throw new Error(`Failed to delete file: ${message}`);
    }

    throw error;
  }
};

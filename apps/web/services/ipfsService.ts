import { Config } from "@/config/config";
import axios from "axios";

const GATEWAY_URL = "https://violet-added-quelea-543.mypinata.cloud";

const MAX_CACHE_SIZE = 100;
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

export const ipfsApiClient = axios.create({
  baseURL: "https://api.pinata.cloud",
  headers: {
    "Content-Type": "application/json",
    pinata_api_key: Config.PINATA_API_KEY!,
    pinata_secret_api_key: Config.PINATA_SECRET_API_KEY!,
  },
});

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
    const randomId = Math.random().toString(36).substring(2, 10);

    const data = {
      pinataContent: file_content,
      pinataMetadata: {
        name: `data-${randomId}`,
        keyvalues: {
          contentType: "encrypted",
        },
      },
    };

    const response = await ipfsApiClient.post("/pinning/pinJSONToIPFS", data);
    const cid = response.data.IpfsHash;

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
 * Downloads text content from IPFS using the Pinata gateway.
 *
 * @param cid - The IPFS Content Identifier of the file to download.
 * @param options - Optional settings for download operation.
 * @returns A Promise that resolves to the file contents as a string.
 * @throws Will throw an error if the fetch request fails or the response is not OK.
 */
export const ipfsDownload = async (cid: string): Promise<string> => {
  if (contentCache[cid]) {
    console.log(`Cache hit for CID: ${cid}`);
    contentCache[cid].lastAccessed = Date.now();
    return contentCache[cid].content;
  }

  console.log(`Cache miss for CID: ${cid}. Downloading from IPFS gateway.`);

  try {
    const response = await ipfsGatewayClient.get(`/ipfs/${cid}`);
    const content = response.data;

    if (typeof content === "string" && content.length <= MAX_CONTENT_SIZE) {
      manageCacheSize();
      contentCache[cid] = {
        content: content,
        lastAccessed: Date.now(),
      };
    }

    return content;
  } catch (error) {
    console.error("Error downloading from IPFS gateway:", error);
    throw new Error(
      `Failed to download from IPFS: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// /**
//  * Deletes a file from IPFS using the Lighthouse service.
//  * @param cid - The IPFS Content Identifier of the file to delete.
//  * @returns A Promise that resolves to true if deletion was successful, false otherwise.
//  */
// export const ipfsDelete = async (cid: string): Promise<boolean> => {
//   console.log("Deleting file with CID:", cid);
//   const response = await lighthouse.deleteFile(Config.LIGHTHOUSE_API_KEY!, cid);

//   if (response.data.message !== "File deleted successfully") {
//     return false;
//   }

//   return true;
// };

// /**
//  * Fetches a list of files uploaded to IPFS using the Lighthouse service.
//  * @returns A Promise that resolves to an array of uploaded file metadata.
//  */
// export const ipfsGetFiles = async () => {
//   const response = await lighthouse.getUploads(Config.LIGHTHOUSE_API_KEY!, null);
//   return response.data;
// };

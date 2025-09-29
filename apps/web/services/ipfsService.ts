import { Config } from "@/config/config";
import lighthouse from "@lighthouse-web3/sdk";

/**
 * Uploads plain text content to IPFS using the Lighthouse service.
 *
 * @param file_content - The string content to be uploaded.
 * @returns A Promise that resolves to the CID (Content Identifier) of the uploaded file.
 * @throws Will throw an error if the upload request fails.
 */
export const ipfsUpload = async (file_content: string): Promise<string> => {
  try {
    const response = await lighthouse.uploadText(file_content, Config.LIGHTHOUSE_API_KEY!);
    console.log("File uploaded to IPFS:", response.data);
    return response.data.Hash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

/**
 * Downloads text content from IPFS using the Lighthouse gateway.
 *
 * @param cid - The IPFS Content Identifier of the file to download.
 * @returns A Promise that resolves to the file contents as a string.
 * @throws Will throw an error if the fetch request fails or the response is not OK.
 */
export const ipfsDownload = async (cid: string): Promise<string> => {
  try {
    const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from IPFS. Status: ${response.status}`);
    }

    const content = await response.text();
    return content;
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    throw error;
  }
};

/**
 * Deletes a file from IPFS using the Lighthouse service.
 * @param cid - The IPFS Content Identifier of the file to delete.
 * @returns A Promise that resolves to true if deletion was successful, false otherwise.
 */
export const ipfsDelete = async (cid: string): Promise<boolean> => {
  console.log("Deleting file with CID:", cid);
  const response = await lighthouse.deleteFile(Config.LIGHTHOUSE_API_KEY!, cid);

  if (response.data.message !== "File deleted successfully") {
    return false;
  }

  return true;
};

/**
 * Fetches a list of files uploaded to IPFS using the Lighthouse service.
 * @returns A Promise that resolves to an array of uploaded file metadata.
 */
export const ipfsGetFiles = async () => {
  const response = await lighthouse.getUploads(Config.LIGHTHOUSE_API_KEY!, null);
  return response.data;
};

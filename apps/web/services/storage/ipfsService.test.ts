import { describe, it, expect, spyOn, mock } from "bun:test";

mock.module("@/config/config", () => ({
  Config: {
    APP_API_URL: "http://localhost:3001",
    APP_API_KEY: "test-api-key",
    PINATA_JWT: "test-pinata-jwt-token",
    WEB3AUTH_CLIENT_ID: "test-web3auth-client-id",
    APP_SALT: "0dsfwsaf2na8mc80a8efv8qpo",
  },
}));

import {
  ipfsUpload,
  ipfsDownload,
  ipfsApiClient,
  ipfsGatewayClient,
  ipfsDelete,
} from "./ipfsService";

describe("ipfsUpload", () => {
  it("should upload content and return CID", async () => {
    const mockCid = "QmTest123ABC";
    const content = "encrypted-content";

    spyOn(ipfsApiClient, "post").mockResolvedValue({
      data: {
        data: {
          cid: mockCid,
        },
      },
    });

    const cid = await ipfsUpload(content);

    expect(cid).toBe(mockCid);
    expect(ipfsApiClient.post).toHaveBeenCalledWith(
      "/files",
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );
  });

  it("should cache content after upload if under size limit", async () => {
    const mockCid = "QmCacheTest789";
    const content = "small-content";

    spyOn(ipfsApiClient, "post").mockResolvedValue({
      data: {
        data: {
          cid: mockCid,
        },
      },
    });

    await ipfsUpload(content);

    const result = await ipfsDownload(mockCid);

    expect(result).toBe(content);
  });

  it("should throw error on upload failure", async () => {
    spyOn(ipfsApiClient, "post").mockRejectedValue(new Error("Network error"));
    expect(ipfsUpload("fail")).rejects.toThrow("Network error");
  });
});

describe("ipfsDownload", () => {
  it("should download content from gateway", async () => {
    const mockCid = "QmDownloadNew456";
    const mockContent = "downloaded-content";

    spyOn(ipfsGatewayClient, "get").mockResolvedValue({
      data: mockContent,
    });

    const content = await ipfsDownload(mockCid);

    expect(content).toBe(mockContent);
    expect(ipfsGatewayClient.get).toHaveBeenCalledWith(`/ipfs/${mockCid}`);
  });

  it("should throw error on download failure", async () => {
    spyOn(ipfsGatewayClient, "get").mockRejectedValue(new Error("Gateway error"));
    expect(ipfsDownload("QmFailNew999")).rejects.toThrow("Gateway error");
  });
});

describe("Cache Management", () => {
  it("should evict LRU entry when cache is full", async () => {
    const uploads = Array.from({ length: 101 }, (_, i) => ({
      cid: `QmLRUTest${i}${Date.now()}`,
      content: `content-${i}`,
    }));

    for (const { cid, content } of uploads) {
      spyOn(ipfsApiClient, "post").mockResolvedValueOnce({
        data: {
          data: {
            cid: cid,
          },
        },
      });
      await ipfsUpload(content);
    }

    spyOn(ipfsGatewayClient, "get").mockResolvedValue({
      data: uploads[0].content,
    });

    await ipfsDownload(uploads[0].cid);

    expect(ipfsGatewayClient.get).toHaveBeenCalledWith(`/ipfs/${uploads[0].cid}`);
  });
});

describe("IpfsDelete", () => {
  it("should delete a file by CID", async () => {
    const mockCid = "QmDeleteTest123";
    const mockFileId = "file-id-123";

    spyOn(ipfsApiClient, "get").mockResolvedValue({
      data: {
        data: {
          files: [
            {
              id: mockFileId,
              cid: mockCid,
            },
          ],
        },
      },
    });

    spyOn(ipfsApiClient, "delete").mockResolvedValue({
      data: { success: true },
    });

    const result = await ipfsDelete(mockCid);

    expect(result).toEqual({
      success: true,
      message: `Successfully deleted file with CID: ${mockCid}`,
    });

    expect(ipfsApiClient.get).toHaveBeenCalledWith(
      "/files/public",
      expect.objectContaining({
        params: {
          cid: mockCid,
          limit: 1,
        },
      })
    );

    expect(ipfsApiClient.delete).toHaveBeenCalledWith(`/files/public/${mockFileId}`);
  });

  it("should return error if file not found", async () => {
    const mockCid = "QmNonExistentCID";

    spyOn(ipfsApiClient, "get").mockResolvedValue({
      data: {
        data: {
          files: [],
        },
      },
    });

    expect(ipfsDelete(mockCid)).rejects.toThrow(`File with CID ${mockCid} not found`);
  });
});

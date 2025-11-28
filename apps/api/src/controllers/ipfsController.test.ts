import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import * as ipfsController from "./ipfsController";

afterEach(() => {
  mock.restore(); // resets ALL mocks
});

// Mocks
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {}),
};
mock.module("@/utils/logger", () => ({
  default: mockLogger,
}));

const mockPinata = {
  upload: {
    public: {
      createSignedURL: mock(() => Promise.resolve("https://presigned-url.com")),
    },
  },
  files: {
    public: {
      delete: mock(() => Promise.resolve({ success: true })),
    },
  },
};
mock.module("@/constants/pinata", () => ({
  pinata: mockPinata,
}));

function mockReqRes(body: any = {}, query: any = {}) {
  const req = {
    body,
    query,
  };

  const res = {
    status: mock(() => res),
    json: mock(() => {}),
  };

  return { req, res };
}

describe("ipfsController", () => {
  beforeEach(() => {
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockPinata.upload.public.createSignedURL.mockClear();
    mockPinata.files.public.delete.mockClear();
  });

  describe("getPresignedIpfsUrl", () => {
    test("creates signed URL with default parameters", async () => {
      const { req, res } = mockReqRes({}, {});

      await ipfsController.getPresignedIpfsUrl(req as any, res as any);

      expect(mockPinata.upload.public.createSignedURL).toHaveBeenCalledWith({
        expires: 60,
        mimeTypes: ["application/json"],
        maxFileSize: 50000000,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ url: "https://presigned-url.com" });
    });

    test("creates signed URL with custom parameters", async () => {
      const { req, res } = mockReqRes(
        {},
        {
          expires: "120",
          mime: "image/png",
          maxSize: "1000000",
          filename: "test.png",
        }
      );

      await ipfsController.getPresignedIpfsUrl(req as any, res as any);

      expect(mockPinata.upload.public.createSignedURL).toHaveBeenCalledWith({
        expires: 120,
        mimeTypes: ["image/png"],
        maxFileSize: 1000000,
        filename: "test.png",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ url: "https://presigned-url.com" });
    });

    test("handles Pinata API error", async () => {
      mockPinata.upload.public.createSignedURL.mockRejectedValue(new Error("Pinata API error"));
      const { req, res } = mockReqRes({}, {});

      await ipfsController.getPresignedIpfsUrl(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Pinata API error" });
    });

    test("handles error without message", async () => {
      mockPinata.upload.public.createSignedURL.mockRejectedValue({});
      const { req, res } = mockReqRes({}, {});

      await ipfsController.getPresignedIpfsUrl(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error creating signed URL" });
    });
  });

  describe("deleteFile", () => {
    test("deletes file successfully", async () => {
      const { req, res } = mockReqRes({ file_id: "file123" });

      await ipfsController.deleteFile(req as any, res as any);

      expect(mockPinata.files.public.delete).toHaveBeenCalledWith(["file123"]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { file_id: "file123", result: { success: true } },
        "IPFS file deleted successfully"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "File with ID file123 deleted successfully.",
        result: { success: true },
      });
    });

    test("handles missing file_id", async () => {
      const { req, res } = mockReqRes({});

      await ipfsController.deleteFile(req as any, res as any);

      expect(mockPinata.files.public.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing file_id in request body" });
    });

    test("handles Pinata delete error", async () => {
      mockPinata.files.public.delete.mockRejectedValue(new Error("Delete failed"));
      const { req, res } = mockReqRes({ file_id: "file123" });

      await ipfsController.deleteFile(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Error deleting IPFS file"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: "Delete failed" });
    });

    test("handles error with response data", async () => {
      const error = { response: { data: { error: "Specific error" } } };
      mockPinata.files.public.delete.mockRejectedValue(error);
      const { req, res } = mockReqRes({ file_id: "file123" });

      await ipfsController.deleteFile(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: "Specific error" });
    });

    test("handles error without message", async () => {
      mockPinata.files.public.delete.mockRejectedValue({});
      const { req, res } = mockReqRes({ file_id: "file123" });

      await ipfsController.deleteFile(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Error deleting file from Pinata",
      });
    });
  });
});

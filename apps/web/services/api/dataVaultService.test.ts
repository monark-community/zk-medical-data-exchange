import { describe, it, expect, beforeEach, mock } from "bun:test";
import { uploadMedicalData, fetchCIDs, deleteCID } from "./dataVaultService";

/**
 * Test suite for Data Vault Service
 * Tests API calls for medical data operations
 */

// Mock apiClient
const mockApiClient = {
  get: mock(() => Promise.resolve({ data: [] })) as any,
  post: mock(() => Promise.resolve({ data: {} })) as any,
  delete: mock(() => Promise.resolve({ data: {} })) as any,
};

// Mock the apiClient module
mock.module("@/services/core/apiClient", () => ({
  apiClient: mockApiClient,
}));

describe("DataVaultService - uploadMedicalData", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  it("should upload medical data successfully", async () => {
    const mockResponse = { success: true, id: 123 };
    mockApiClient.post.mockResolvedValue({ data: mockResponse });

    const result = await uploadMedicalData(
      "0x1234567890abcdef",
      "QmTest123",
      "lab_report",
      "file123"
    );

    expect(mockApiClient.post).toHaveBeenCalledWith("/medical-data", {
      wallet_address: "0x1234567890abcdef",
      encrypted_cid: "QmTest123",
      resource_type: "lab_report",
      file_id: "file123",
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle API error during upload", async () => {
    const error = new Error("Upload failed");
    mockApiClient.post.mockRejectedValue(error);

    expect(uploadMedicalData("0x123", "QmTest", "report", "file1")).rejects.toThrow(
      "Upload failed"
    );
  });
});

describe("DataVaultService - fetchCIDs", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch CIDs successfully and map data correctly", async () => {
    const mockApiResponse = [
      {
        encrypted_cid: "QmTest123",
        resource_type: "lab_report",
        created_at: "2025-11-15T10:00:00Z",
        file_id: "file123",
      },
      {
        encrypted_cid: "QmTest456",
        resource_type: "medical_record",
        created_at: "2025-11-14T09:00:00Z",
        file_id: "file456",
      },
    ];
    mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

    const result = await fetchCIDs("0x1234567890abcdef");

    expect(mockApiClient.get).toHaveBeenCalledWith("/medical-data", {
      params: { wallet_address: "0x1234567890abcdef" },
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      encryptedCid: "QmTest123",
      resourceType: "lab_report",
      createdAt: "2025-11-15T10:00:00Z",
      fileId: "file123",
    });
    expect(result[1]).toEqual({
      encryptedCid: "QmTest456",
      resourceType: "medical_record",
      createdAt: "2025-11-14T09:00:00Z",
      fileId: "file456",
    });
  });

  it("should return empty array when no data", async () => {
    mockApiClient.get.mockResolvedValue({ data: [] });

    const result = await fetchCIDs("0x123");

    expect(result).toEqual([]);
  });

  it("should handle API error during fetch", async () => {
    const error = new Error("Fetch failed");
    mockApiClient.get.mockRejectedValue(error);

    expect(fetchCIDs("0x123")).rejects.toThrow("Fetch failed");
  });
});

describe("DataVaultService - deleteCID", () => {
  beforeEach(() => {
    mockApiClient.delete.mockClear();
  });

  it("should delete CID successfully", async () => {
    const mockResponse = { success: true };
    mockApiClient.delete.mockResolvedValue({ data: mockResponse });

    const result = await deleteCID("0x1234567890abcdef", "QmTest123");

    expect(mockApiClient.delete).toHaveBeenCalledWith("/medical-data", {
      data: {
        wallet_address: "0x1234567890abcdef",
        encrypted_cid: "QmTest123",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle API error during delete", async () => {
    const error = new Error("Delete failed");
    mockApiClient.delete.mockRejectedValue(error);

    expect(deleteCID("0x123", "QmTest")).rejects.toThrow("Delete failed");
  });
});

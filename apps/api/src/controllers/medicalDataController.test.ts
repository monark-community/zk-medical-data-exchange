import { describe, test, expect, beforeEach, mock } from "bun:test";
import * as medicalDataController from "./medicalDataController";

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

const DATA_VAULT = {
  name: "data_vault",
  columns: {
    walletAddress: "wallet_address",
    encryptedCid: "encrypted_cid",
    resourceType: "resource_type",
    createdAt: "created_at",
    fileId: "file_id",
    id: "id",
  },
};
mock.module("@/constants/db", () => ({
  TABLES: { DATA_VAULT },
}));

const mockAuditService = {
  logDataUpload: mock(() => Promise.resolve()),
  logDataDeletion: mock(() => Promise.resolve()),
  logAction: mock(() => Promise.resolve()),
};
mock.module("@/services/auditService", () => ({
  auditService: mockAuditService,
  ActionType: {
    DATA_UPLOAD: "DATA_UPLOAD",
    DATA_DELETED: "DATA_DELETED",
  },
}));

const mockUserProfile = {
  DATA_SELLER: 0,
  RESEARCHER: 1,
  ADMIN: 2,
  COMMON: 3,
};
mock.module("@zk-medical/shared", () => ({
  UserProfile: mockUserProfile,
}));

function mockReqRes(body: any = {}, query: any = {}, supabase: any = {}) {
  const req = {
    body,
    query,
    supabase,
    get: mock(() => "test-user-agent"),
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
  };

  const res = {
    status: mock(() => res),
    json: mock(() => {}),
  };

  return { req, res };
}

describe("medicalDataController", () => {
  beforeEach(() => {
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockAuditService.logDataUpload.mockClear();
    mockAuditService.logDataDeletion.mockClear();
    mockAuditService.logAction.mockClear();
  });

  describe("uploadCID", () => {
    test("uploads data successfully", async () => {
      const mockSupabase = {
        from: mock(() => mockSupabase),
        insert: mock(async () => ({ error: null })),
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
          file_id: "file123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockSupabase.from).toHaveBeenCalledWith("data_vault");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        wallet_address: "0xabc",
        encrypted_cid: "QmTest123",
        resource_type: "medical_record",
        file_id: "file123",
      });
      expect(mockAuditService.logDataUpload).toHaveBeenCalledWith(
        "0xabc",
        "medical_record",
        "QmTest123",
        true,
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith("uploadCID success");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Data uploaded successfully",
        cid: "QmTest123",
      });
    });

    test("handles database insert error", async () => {
      const mockSupabase = {
        from: mock(() => mockSupabase),
        insert: mock(async () => ({ error: { message: "Insert failed" } })),
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockAuditService.logDataUpload).toHaveBeenCalledWith(
        "0xabc",
        "medical_record",
        "QmTest123",
        false,
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
    });

    test("handles database insert error with audit failure", async () => {
      mockAuditService.logDataUpload.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        from: mock(() => mockSupabase),
        insert: mock(async () => ({ error: { message: "Insert failed" } })),
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for failed upload"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
    });

    test("handles unexpected errors", async () => {
      const mockSupabase = {
        from: () => {
          throw new Error("Unexpected error");
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        user: "0xabc",
        userProfile: 0,
        actionType: "DATA_UPLOAD",
        resource: "data_vault",
        action: "upload_data",
        success: false,
        metadata: expect.any(Object),
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });

    test("handles missing resource_type", async () => {
      const mockSupabase = {
        from: mock(() => mockSupabase),
        insert: mock(async () => ({ error: null })),
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockAuditService.logDataUpload).toHaveBeenCalledWith(
        "0xabc",
        "unknown_file",
        "QmTest123",
        true,
        expect.any(Object)
      );
    });

    test("handles audit service failure on success", async () => {
      mockAuditService.logDataUpload.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        from: mock(() => mockSupabase),
        insert: mock(async () => ({ error: null })),
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
          file_id: "file123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.uploadCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for successful upload"
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Data uploaded successfully",
        cid: "QmTest123",
      });
    });
  });

  describe("downloadCIDs", () => {
    test("downloads data successfully", async () => {
      const mockData = [
        {
          encrypted_cid: "QmTest123",
          resource_type: "medical_record",
          created_at: "2025-01-01",
          file_id: "file123",
        },
      ];
      const mockSupabase = {
        from: mock(() => mockSupabase),
        select: mock(() => mockSupabase),
        eq: mock(async () => ({ data: mockData, error: null })),
      };
      const { req, res } = mockReqRes({}, { wallet_address: "0xabc" }, mockSupabase);

      await medicalDataController.downloadCIDs(req as any, res as any);

      expect(mockSupabase.from).toHaveBeenCalledWith("data_vault");
      expect(mockSupabase.select).toHaveBeenCalledWith(
        "encrypted_cid, resource_type, created_at, file_id"
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith("wallet_address", "0xabc");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("handles database select error", async () => {
      const mockSupabase = {
        from: mock(() => mockSupabase),
        select: mock(() => mockSupabase),
        eq: mock(async () => ({ data: null, error: { message: "Select failed" } })),
      };
      const { req, res } = mockReqRes({}, { wallet_address: "0xabc" }, mockSupabase);

      await medicalDataController.downloadCIDs(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Select failed" });
    });

    test("handles unexpected errors", async () => {
      const mockSupabase = {
        from: () => {
          throw new Error("Unexpected error");
        },
      };
      const { req, res } = mockReqRes({}, { wallet_address: "0xabc" }, mockSupabase);

      await medicalDataController.downloadCIDs(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("deleteCID", () => {
    test("deletes data successfully", async () => {
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        delete: mock(function () {
          this.operation = "delete";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [{ id: 1 }], error: null });
          } else if (this.operation === "delete") {
            resolve({ error: null });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };

      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockAuditService.logDataDeletion).toHaveBeenCalledWith(
        "0xabc",
        "data_file",
        "QmTest123",
        true,
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith("deleteCID success");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Data deleted successfully" });
    });

    test("handles record not found", async () => {
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [], error: null });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        user: "0xabc",
        userProfile: 0,
        actionType: "DATA_DELETED",
        resource: "data_vault",
        action: "delete_data",
        success: false,
        metadata: expect.any(Object),
        sensitiveData: {
          encrypted_cid: "QmTest123...",
        },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Record not found" });
    });

    test("handles record not found with audit failure", async () => {
      mockAuditService.logAction.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [], error: null });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for record not found"
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Record not found" });
    });

    test("handles check query error", async () => {
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: null, error: { message: "Check failed" } });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        user: "0xabc",
        userProfile: 0,
        actionType: "DATA_DELETED",
        resource: "data_vault",
        action: "delete_data",
        success: false,
        metadata: expect.any(Object),
        sensitiveData: {
          encrypted_cid: "QmTest123...",
        },
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Check failed" });
    });

    test("handles check query error with audit failure", async () => {
      mockAuditService.logAction.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: null, error: { message: "Check failed" } });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for delete check error"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Check failed" });
    });

    test("handles delete query error", async () => {
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        delete: mock(function () {
          this.operation = "delete";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [{ id: 1 }], error: null });
          } else if (this.operation === "delete") {
            resolve({ error: { message: "Delete failed" } });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };

      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        user: "0xabc",
        userProfile: 0,
        actionType: "DATA_DELETED",
        resource: "data_vault",
        action: "delete_data",
        success: false,
        metadata: expect.any(Object),
        sensitiveData: {
          encrypted_cid: "QmTest123...",
        },
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Delete failed" });
    });

    test("handles delete query error with audit failure", async () => {
      mockAuditService.logAction.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        delete: mock(function () {
          this.operation = "delete";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [{ id: 1 }], error: null });
          } else if (this.operation === "delete") {
            resolve({ error: { message: "Delete failed" } });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };

      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for delete error"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Delete failed" });
    });

    test("handles unexpected errors", async () => {
      const mockSupabase = {
        from: () => {
          throw new Error("Unexpected error");
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        user: "0xabc",
        userProfile: 0,
        actionType: "DATA_DELETED",
        resource: "data_vault",
        action: "delete_data",
        success: false,
        metadata: expect.any(Object),
        sensitiveData: {
          encrypted_cid: "QmTest123...",
        },
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });

    test("handles unexpected errors with audit failure", async () => {
      mockAuditService.logAction.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        from: () => {
          throw new Error("Unexpected error");
        },
      };
      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { auditError: expect.any(Error) },
        "Failed to log audit event for delete unexpected error"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });

    test("handles audit service failure on delete success", async () => {
      mockAuditService.logDataDeletion.mockRejectedValue(new Error("Audit failed"));
      const mockSupabase = {
        operation: null as string | null,
        result: null as any,
        from: mock(function () {
          this.operation = null;
          this.result = null;
          return this;
        }),
        select: mock(function () {
          this.operation = "select";
          return this;
        }),
        delete: mock(function () {
          this.operation = "delete";
          return this;
        }),
        eq: mock(function () {
          return this;
        }),
        then: async function (resolve) {
          if (this.operation === "select") {
            resolve({ data: [{ id: 1 }], error: null });
          } else if (this.operation === "delete") {
            resolve({ error: null });
          } else {
            resolve({ data: null, error: { message: "Unknown operation" } });
          }
        },
      };

      const { req, res } = mockReqRes(
        {
          wallet_address: "0xabc",
          encrypted_cid: "QmTest123",
        },
        {},
        mockSupabase
      );

      await medicalDataController.deleteCID(req as any, res as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to log audit event for successful delete"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Data deleted successfully" });
    });
  });
});

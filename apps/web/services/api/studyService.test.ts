import { describe, it, expect, beforeEach, beforeAll, mock } from "bun:test";

// Mock apiClient
const mockApiClient = {
  get: mock(() => Promise.resolve({ data: {} })) as any,
  post: mock(() => Promise.resolve({ data: {} })) as any,
  patch: mock(() => Promise.resolve({ data: {} })) as any,
  delete: mock(() => Promise.resolve({ data: {} })) as any,
};

// Mock ZK proof generator functions
const mockZkFunctions = {
  checkEligibility: mock(() => true) as any,
  generateDataCommitment: mock(() => BigInt(12345)) as any,
  generateSecureSalt: mock(() => BigInt(67890)) as any,
  generateZKProof: mock(() =>
    Promise.resolve({
      proof: {
        a: ["0x1", "0x2"],
        b: [
          ["0x3", "0x4"],
          ["0x5", "0x6"],
        ],
        c: ["0x7", "0x8"],
      },
      publicSignals: ["123", "456"],
    })
  ) as any,
};

// Mock modules
mock.module("@/services/core/apiClient", () => ({
  apiClient: mockApiClient,
}));

mock.module("@/services/zk/zkProofGenerator", () => mockZkFunctions);

mock.module("ethers", () => ({
  BrowserProvider: class MockBrowserProvider {
    constructor() {
      // Mock constructor to prevent real provider initialization
    }
    async getSigner() {
      return {
        signMessage: mock(() => Promise.resolve("mock-signature")),
        getAddress: mock(() => Promise.resolve("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")),
      };
    }
  },
}));

import {
  getStudies,
  getEnrolledStudies,
  getStudyDetails,
  createStudy,
  updateStudyStatus,
  deployStudy,
  deleteStudy,
  StudyApplicationService,
  useCreateStudy,
  revokeStudyConsent,
  grantStudyConsent,
  type StudySummary,
  type StudyDetails,
  type CreateStudyRequest,
  type CreateStudyResponse,
  type StudyApplicationRequest,
  endStudy,
} from "./studyService";
import { StudyCriteria } from "@zk-medical/shared";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

/**
 * Test suite for Frontend Study Service
 * Tests study creation, enrollment, consent management, and ZK proof application
 */

// Setup global window for tests
beforeAll(() => {
  (globalThis as any).window = {
    ethereum: {
      request: mock(() => {
        throw new Error("Mock: Real blockchain calls should not happen in tests");
      }),
      isMetaMask: true,
      on: mock(() => {}),
      removeListener: mock(() => {}),
    },
  };
});

// Test data
const mockStudyCriteria: StudyCriteria = {
  enableAge: 1,
  minAge: 18,
  maxAge: 65,
  enableGender: 1,
  allowedGender: 1,
  enableDiabetes: 0,
  allowedDiabetes: 0,
  enableSmoking: 0,
  allowedSmoking: 0,
  enableBMI: 0,
  minBMI: 0,
  maxBMI: 0,
  enableBloodPressure: 0,
  minSystolic: 0,
  maxSystolic: 0,
  minDiastolic: 0,
  maxDiastolic: 0,
  enableCholesterol: 0,
  minCholesterol: 0,
  maxCholesterol: 0,
  enableHeartDisease: 0,
  allowedHeartDisease: 0,
  enableActivity: 0,
  minActivityLevel: 0,
  maxActivityLevel: 0,
  enableHbA1c: 0,
  minHbA1c: 0,
  maxHbA1c: 0,
  enableBloodType: 0,
  allowedBloodTypes: [0, 0, 0, 0] as const,
  enableLocation: 0,
  allowedRegions: [0, 0, 0, 0] as const,
};

const mockMedicalData: ExtractedMedicalData = {
  age: 25,
  gender: 1,
  diabetesStatus: 0,
  smokingStatus: 0,
  bmi: 22.5,
  systolicBP: 120,
  diastolicBP: 80,
  cholesterol: 180,
  heartDiseaseStatus: 0,
  activityLevel: 1,
  hba1c: 5.5,
  bloodType: 1,
  regions: [1, 0, 0, 0],
};

describe("StudyService - Type Interfaces", () => {
  it("should validate StudySummary interface", () => {
    const summary: StudySummary = {
      id: 1,
      title: "Diabetes Study",
      description: "Study about diabetes",
      maxParticipants: 100,
      currentParticipants: 25,
      status: "active",
      complexityScore: 5,
      templateName: "diabetes_template",
      createdAt: new Date().toISOString(),
      durationDays: 90,
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      isEnrolled: true,
      hasConsented: true,
      criteriaSummary: {
        requiresAge: true,
        requiresGender: true,
        requiresDiabetes: false,
        requiresSmoking: false,
        requiresBMI: false,
        requiresBloodPressure: false,
        requiresCholesterol: false,
        requiresHeartDisease: false,
        requiresActivity: false,
        requiresHbA1c: false,
        requiresBloodType: false,
        requiresLocation: false,
      },
    };

    expect(summary.id).toBe(1);
    expect(summary.status).toBe("active");
    expect(summary.criteriaSummary.requiresAge).toBe(true);
  });

  it("should validate CreateStudyRequest interface", () => {
    const request: CreateStudyRequest = {
      title: "New Study",
      description: "Description",
      maxParticipants: 50,
      durationDays: 60,
      templateName: "template1",
      createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    };

    expect(request.title).toBeDefined();
    expect(request.maxParticipants).toBe(50);
  });

  it("should validate StudyApplicationRequest interface", () => {
    const request: StudyApplicationRequest = {
      studyId: 1,
      participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      proofJson: {
        a: ["0x1", "0x2"],
        b: [
          ["0x3", "0x4"],
          ["0x5", "0x6"],
        ],
        c: ["0x7", "0x8"],
      },
      publicInputsJson: ["123", "456"],
      dataCommitment: "12345",
    };

    expect(request.studyId).toBe(1);
    expect(request.proofJson.a).toHaveLength(2);
    expect(request.proofJson.b).toHaveLength(2);
    expect(request.proofJson.c).toHaveLength(2);
  });
});

describe("StudyService - getStudies", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch studies without parameters", async () => {
    const mockData = {
      studies: [{ id: 1, title: "Study 1" }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getStudies();

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies?");
    expect(result.studies).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("should fetch studies with status filter", async () => {
    const mockData = {
      studies: [{ id: 1, title: "Active Study", status: "active" }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    await getStudies({ status: "active" });

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies?status=active");
  });

  it("should fetch studies with pagination parameters", async () => {
    mockApiClient.get.mockResolvedValue({
      data: { studies: [], pagination: { page: 2, limit: 20, total: 100, totalPages: 5 } },
    });

    await getStudies({ page: 2, limit: 20 });

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies?page=2&limit=20");
  });

  it("should fetch studies created by specific user", async () => {
    mockApiClient.get.mockResolvedValue({
      data: { studies: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });

    await getStudies({ createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/studies?createdBy=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );
  });

  it("should fetch studies with all parameters", async () => {
    mockApiClient.get.mockResolvedValue({
      data: { studies: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });

    await getStudies({
      status: "active",
      page: 3,
      limit: 15,
      createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/studies?status=active&page=3&limit=15&createdBy=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );
  });
});

describe("StudyService - getEnrolledStudies", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch enrolled studies for a wallet", async () => {
    const mockData = {
      studies: [
        { id: 1, title: "Study 1", isEnrolled: true },
        { id: 2, title: "Study 2", isEnrolled: true },
      ],
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await getEnrolledStudies("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/studies/enrolled/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no studies enrolled", async () => {
    mockApiClient.get.mockResolvedValue({ data: { studies: [] } });

    const result = await getEnrolledStudies("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result).toEqual([]);
  });

  it("should return empty array on 404 error", async () => {
    mockApiClient.get.mockRejectedValue({
      response: { status: 404, data: { studies: null } },
    });

    const result = await getEnrolledStudies("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result).toEqual([]);
  });

  it("should return empty array when studies is null", async () => {
    mockApiClient.get.mockRejectedValue({
      response: { status: 200, data: { studies: null } },
    });

    const result = await getEnrolledStudies("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(result).toEqual([]);
  });

  it("should throw error for non-404 errors", async () => {
    mockApiClient.get.mockRejectedValue({
      response: { status: 500, data: { error: "Server error" } },
    });

    expect(async () => {
      await getEnrolledStudies("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    }).toThrow();
  });
});

describe("StudyService - getStudyDetails", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  it("should fetch study details by ID", async () => {
    const mockDetails: StudyDetails = {
      id: 1,
      title: "Detailed Study",
      maxParticipants: 100,
      currentParticipants: 50,
      status: "active",
      complexityScore: 7,
      createdAt: new Date().toISOString(),
      eligibilityCriteria: mockStudyCriteria,
      criteriaSummary: {
        requiresAge: true,
        requiresGender: true,
        requiresDiabetes: false,
      },
      stats: {
        complexityScore: 7,
        criteriaHash: "0xabc123",
      },
    };

    mockApiClient.get.mockResolvedValue({ data: { study: mockDetails } });

    const result = await getStudyDetails(1);

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies/1");
    expect(result.id).toBe(1);
    expect(result.eligibilityCriteria).toBeDefined();
  });
});

describe("StudyService - createStudy", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  it("should create a study successfully", async () => {
    const mockResponse: CreateStudyResponse = {
      success: true,
      study: {
        id: 1,
        title: "New Study",
        description: "Study description",
        maxParticipants: 100,
        durationDays: 90,
        eligibilityCriteria: mockStudyCriteria,
        status: "draft",
        stats: {
          enabledCriteriaCount: 2,
          complexity: "medium",
          criteriaHash: "0xabc123",
        },
        createdAt: new Date().toISOString(),
      },
    };

    mockApiClient.post.mockResolvedValue({ data: mockResponse });

    const studyData: CreateStudyRequest = {
      title: "New Study",
      description: "Study description",
      maxParticipants: 100,
      durationDays: 90,
      customCriteria: mockStudyCriteria,
    };

    const result = await createStudy(studyData);

    expect(mockApiClient.post).toHaveBeenCalledWith("/studies", studyData);
    expect(result.success).toBe(true);
    expect(result.study.title).toBe("New Study");
  });

  it("should handle API error with error message", async () => {
    mockApiClient.post.mockRejectedValue({
      response: {
        data: { error: "Invalid study data" },
      },
    });

    const studyData: CreateStudyRequest = {
      title: "Invalid Study",
      maxParticipants: -1,
    };

    expect(createStudy(studyData)).rejects.toThrow("Invalid study data");
  });

  it("should handle network error", async () => {
    mockApiClient.post.mockRejectedValue(new Error("Network timeout"));

    const studyData: CreateStudyRequest = {
      title: "Study",
      maxParticipants: 50,
    };

    await expect(createStudy(studyData)).rejects.toThrow("Network timeout");
  });

  it("should handle error without message", async () => {
    mockApiClient.post.mockRejectedValue({});

    const studyData: CreateStudyRequest = {
      title: "Study",
      maxParticipants: 50,
    };

    expect(createStudy(studyData)).rejects.toThrow("Network error");
  });
});

describe("StudyService - updateStudyStatus", () => {
  beforeEach(() => {
    mockApiClient.patch.mockClear();
  });

  it("should update study status", async () => {
    mockApiClient.patch.mockResolvedValue({ data: { success: true } });

    await updateStudyStatus(1, { status: "active" });

    expect(mockApiClient.patch).toHaveBeenCalledWith("/studies/1", { status: "active" });
  });

  it("should update contract address", async () => {
    mockApiClient.patch.mockResolvedValue({ data: { success: true } });

    await updateStudyStatus(1, { contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" });

    expect(mockApiClient.patch).toHaveBeenCalledWith("/studies/1", {
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
  });

  it("should update multiple fields", async () => {
    mockApiClient.patch.mockResolvedValue({ data: { success: true } });

    await updateStudyStatus(1, {
      status: "active",
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      deploymentTxHash: "0xdef456",
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith("/studies/1", {
      status: "active",
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      deploymentTxHash: "0xdef456",
    });
  });
});

describe("StudyService - deployStudy", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  it("should deploy study", async () => {
    const mockData = {
      success: true,
      txHash: "0xabc123",
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    };

    mockApiClient.post.mockResolvedValue({ data: mockData });

    const result = await deployStudy(1);

    expect(mockApiClient.post).toHaveBeenCalledWith("/studies/1/deployment");
    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
  });
});

describe("StudyService - deleteStudy", () => {
  beforeEach(() => {
    mockApiClient.delete.mockClear();
  });

  it("should delete study", async () => {
    mockApiClient.delete.mockResolvedValue({ data: { success: true } });

    await deleteStudy(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    expect(mockApiClient.delete).toHaveBeenCalledWith("/studies/1", {
      data: { walletId: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
    });
  });
});

describe("StudyService - endStudy", () => {
  beforeEach(() => {
    // mockApiClient.patch.mockClear();
  });

  it("should end study by updating status to completed", async () => {
    const mockResponse = { success: true, status: "completed" };
    mockApiClient.patch.mockImplementation(() => ({ data: mockResponse }));

    await endStudy(1);

    expect(mockApiClient.patch).toHaveBeenCalledWith("/studies/1", { status: "completed" });
  });
});

describe("StudyApplicationService - applyToStudy", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockZkFunctions.checkEligibility.mockClear();
    mockZkFunctions.generateDataCommitment.mockClear();
    mockZkFunctions.generateSecureSalt.mockClear();
    mockZkFunctions.generateZKProof.mockClear();

    // Reset to default behavior
    mockZkFunctions.checkEligibility.mockReturnValue(true);
    mockZkFunctions.generateDataCommitment.mockReturnValue(BigInt(12345));
    mockZkFunctions.generateSecureSalt.mockReturnValue(BigInt(67890));
    mockZkFunctions.generateZKProof.mockResolvedValue({
      proof: {
        a: ["0x1", "0x2"],
        b: [
          ["0x3", "0x4"],
          ["0x5", "0x6"],
        ],
        c: ["0x7", "0x8"],
      },
      publicSignals: ["123", "456"],
    });
  });

  it("should successfully apply to study when eligible", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } }); // data-commitment
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });
    mockApiClient.post.mockResolvedValueOnce({ data: { success: true } }); // participants

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies/1/criteria");
    expect(mockZkFunctions.checkEligibility).toHaveBeenCalledWith(
      mockMedicalData,
      mockStudyCriteria
    );
    expect(mockZkFunctions.generateSecureSalt).toHaveBeenCalled();
    expect(mockZkFunctions.generateDataCommitment).toHaveBeenCalled();
    expect(mockZkFunctions.generateZKProof).toHaveBeenCalled();
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/studies/1/participants",
      expect.objectContaining({
        studyId: 1,
        participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        dataCommitment: "12345",
      })
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain("Successfully applied");
  });

  it("should fail when not eligible and log failed attempt", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });
    mockZkFunctions.checkEligibility.mockReturnValue(false);
    mockApiClient.post.mockResolvedValueOnce({ data: { success: true } }); // audit

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("don't meet the eligibility criteria");

    // Should have called audit log
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/audit/log-failed-join",
      expect.objectContaining({
        userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        studyId: "1",
        reason: "Eligibility criteria not met",
      })
    );
  });

  it("should continue even if audit logging fails (non-critical)", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });

    mockZkFunctions.checkEligibility.mockReturnValue(false);

    // First post call (audit) fails, but should still return gracefully
    mockApiClient.post.mockRejectedValueOnce(new Error("Audit service down"));

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("don't meet the eligibility criteria");
  });

  it("should handle error fetching study criteria", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Failed to fetch study criteria from server");
  });

  it("should handle error during proof generation", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });

    mockZkFunctions.generateZKProof.mockRejectedValue(new Error("Proof generation failed"));

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Proof generation failed");

    // Should log the failed attempt
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/audit/log-failed-join",
      expect.objectContaining({
        reason: "Application process error",
        metadata: expect.objectContaining({
          stage: "application_process",
        }),
      })
    );
  });

  it("should handle API error during application submission", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });

    // First post call is for the submission (which fails)
    // Second post call would be for audit logging
    mockApiClient.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: "Invalid proof" },
      },
    });
    mockApiClient.post.mockResolvedValueOnce({ data: { success: true } }); // audit log

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid proof");
  });

  it("should handle unknown errors gracefully", async () => {
    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });

    // Mock non-Error object thrown
    mockZkFunctions.generateZKProof.mockRejectedValue("String error");

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("Application failed");
  });
});

describe("StudyService - useCreateStudy Hook", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  it("should create study with template", async () => {
    const mockResponse: CreateStudyResponse = {
      success: true,
      study: {
        id: 1,
        title: "Templated Study",
        maxParticipants: 100,
        durationDays: 60,
        eligibilityCriteria: mockStudyCriteria,
        status: "draft",
        stats: {
          enabledCriteriaCount: 2,
          complexity: "low",
          criteriaHash: "0xabc123",
        },
        templateName: "diabetes_template",
        createdAt: new Date().toISOString(),
      },
    };

    mockApiClient.post.mockResolvedValue({ data: mockResponse });

    const { createStudy: createStudyFn } = useCreateStudy();

    const result = await createStudyFn(
      "Templated Study",
      "Description",
      100,
      60,
      mockStudyCriteria,
      "diabetes_template"
    );

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/studies",
      expect.objectContaining({
        title: "Templated Study",
        templateName: "diabetes_template",
      })
    );
    expect(result.study.templateName).toBe("diabetes_template");
  });

  it("should create study with custom criteria", async () => {
    const mockResponse: CreateStudyResponse = {
      success: true,
      study: {
        id: 2,
        title: "Custom Study",
        maxParticipants: 50,
        eligibilityCriteria: mockStudyCriteria,
        status: "draft",
        stats: {
          enabledCriteriaCount: 3,
          complexity: "medium",
          criteriaHash: "0xdef456",
        },
        createdAt: new Date().toISOString(),
      },
    };

    mockApiClient.post.mockResolvedValue({ data: mockResponse });

    const { createStudy: createStudyFn } = useCreateStudy();

    const result = await createStudyFn(
      "Custom Study",
      "Custom description",
      50,
      90,
      mockStudyCriteria
    );

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/studies",
      expect.objectContaining({
        title: "Custom Study",
        customCriteria: mockStudyCriteria,
      })
    );
    expect(result.study.title).toBe("Custom Study");
  });

  it("should create study with createdBy field", async () => {
    const mockResponse: CreateStudyResponse = {
      success: true,
      study: {
        id: 3,
        title: "Study",
        maxParticipants: 100,
        eligibilityCriteria: mockStudyCriteria,
        status: "draft",
        stats: {
          enabledCriteriaCount: 1,
          complexity: "low",
          criteriaHash: "0x123",
        },
        createdAt: new Date().toISOString(),
      },
    };

    mockApiClient.post.mockResolvedValue({ data: mockResponse });

    const { createStudy: createStudyFn } = useCreateStudy();

    await createStudyFn(
      "Study",
      "Desc",
      100,
      30,
      mockStudyCriteria,
      undefined,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/studies",
      expect.objectContaining({
        createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      })
    );
  });
});

describe("StudyService - Consent Management", () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
  });

  describe("revokeStudyConsent", () => {
    it("should revoke consent successfully", async () => {
      const mockResponse = {
        success: true,
        blockchainTxHash: "0xabc123",
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await revokeStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

      expect(mockApiClient.post).toHaveBeenCalledWith("/studies/1/consent/revoke", {
        participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      });
      expect(result.success).toBe(true);
      expect(result.blockchainTxHash).toBe("0xabc123");
    });

    it("should handle API error with error message", async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: { error: "Consent already revoked" },
        },
      });

      expect(revokeStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to revoke consent: Consent already revoked"
      );
    });

    it("should handle network error", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Network timeout"));

      expect(revokeStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to revoke consent: Network timeout"
      );
    });

    it("should handle unknown error", async () => {
      mockApiClient.post.mockRejectedValue("Unknown error");

      expect(revokeStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to revoke consent: Unknown error occurred"
      );
    });
  });

  describe("grantStudyConsent", () => {
    it("should grant consent successfully", async () => {
      const mockResponse = {
        success: true,
        blockchainTxHash: "0xdef456",
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await grantStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

      expect(mockApiClient.post).toHaveBeenCalledWith("/studies/1/consent/grant", {
        participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      });
      expect(result.success).toBe(true);
      expect(result.blockchainTxHash).toBe("0xdef456");
    });

    it("should handle API error with error message", async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: { error: "Consent already granted" },
        },
      });

      expect(grantStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to grant consent: Consent already granted"
      );
    });

    it("should handle network error", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Connection refused"));

      expect(grantStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to grant consent: Connection refused"
      );
    });

    it("should handle unknown error", async () => {
      mockApiClient.post.mockRejectedValue({ unknown: "error" });

      expect(grantStudyConsent(1, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")).rejects.toThrow(
        "Failed to grant consent: Unknown error occurred"
      );
    });
  });
});

describe("StudyService - Edge Cases", () => {
  it("should handle empty query parameters", async () => {
    mockApiClient.get.mockResolvedValue({
      data: { studies: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });

    await getStudies({});

    expect(mockApiClient.get).toHaveBeenCalledWith("/studies?");
  });

  it("should handle study with minimal data", async () => {
    const minimalStudy: CreateStudyRequest = {
      title: "Minimal Study",
      maxParticipants: 1,
    };

    mockApiClient.post.mockResolvedValue({
      data: {
        success: true,
        study: {
          id: 1,
          title: "Minimal Study",
          maxParticipants: 1,
          eligibilityCriteria: mockStudyCriteria,
          status: "draft",
          stats: {
            enabledCriteriaCount: 0,
            complexity: "low",
            criteriaHash: "0x0",
          },
          createdAt: new Date().toISOString(),
        },
      },
    });

    const result = await createStudy(minimalStudy);

    expect(result.success).toBe(true);
  });

  it("should handle BigInt conversion in data commitment", async () => {
    // Reset mocks and set up fresh state
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockZkFunctions.checkEligibility.mockClear();
    mockZkFunctions.generateDataCommitment.mockClear();
    mockZkFunctions.generateSecureSalt.mockClear();
    mockZkFunctions.generateZKProof.mockClear();

    const largeBigInt = BigInt("999999999999999999999");
    mockZkFunctions.checkEligibility.mockReturnValue(true);
    mockZkFunctions.generateDataCommitment.mockReturnValue(largeBigInt);
    mockZkFunctions.generateSecureSalt.mockReturnValue(BigInt(67890));
    mockZkFunctions.generateZKProof.mockResolvedValue({
      proof: {
        a: ["0x1", "0x2"],
        b: [
          ["0x3", "0x4"],
          ["0x5", "0x6"],
        ],
        c: ["0x7", "0x8"],
      },
      publicSignals: ["123", "456"],
    });

    mockApiClient.post.mockResolvedValueOnce({ data: { challenge: "test-challenge" } });
    mockApiClient.get.mockResolvedValue({
      data: { studyCriteria: mockStudyCriteria },
    });

    mockApiClient.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    const result = await StudyApplicationService.applyToStudy(
      1,
      mockMedicalData,
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    );

    expect(result.success).toBe(true);
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/studies/1/participants",
      expect.objectContaining({
        dataCommitment: largeBigInt.toString(),
      })
    );
  });
});

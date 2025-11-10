import { apiClient } from "@/services/core/apiClient";
import { StudyCriteria } from "@zk-medical/shared";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";
import {
  checkEligibility,
  generateDataCommitment,
  generateSecureSalt,
  generateZKProof,
} from "@/services/zk/zkProofGenerator";

// ========================================
// TYPES
// ========================================

export interface StudySummary {
  id: number;
  title: string;
  description?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: "draft" | "deploying" | "active" | "paused" | "completed";
  complexityScore: number;
  templateName?: string;
  createdAt: string;
  durationDays?: number;
  contractAddress?: string;
  isEnrolled?: boolean;
  hasConsented?: boolean;
  criteriaSummary: {
    requiresAge: boolean;
    requiresGender: boolean;
    requiresDiabetes: boolean;
    requiresSmoking?: boolean;
    requiresBMI?: boolean;
    requiresBloodPressure?: boolean;
    requiresCholesterol?: boolean;
    requiresHeartDisease?: boolean;
    requiresActivity?: boolean;
    requiresHbA1c?: boolean;
    requiresBloodType?: boolean;
    requiresLocation?: boolean;
  };
}

export interface StudyDetails extends StudySummary {
  durationDays?: number;
  eligibilityCriteria: StudyCriteria;
  deploymentTxHash?: string;
  createdBy?: string;
  deployedAt?: string;
  stats: {
    complexityScore: number;
    criteriaHash: string;
  };
}

export interface StudyListResponse {
  studies: StudySummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateStudyRequest {
  title: string;
  description?: string;
  maxParticipants: number;
  durationDays?: number;
  templateName?: string;
  customCriteria?: Partial<StudyCriteria>;
  createdBy?: string;
}

export interface CreateStudyResponse {
  success: boolean;
  study: {
    id: number;
    title: string;
    description?: string;
    maxParticipants: number;
    durationDays?: number;
    eligibilityCriteria: StudyCriteria;
    status: string;
    stats: {
      enabledCriteriaCount: number;
      complexity: string;
      criteriaHash: string;
    };
    templateName?: string;
    createdAt: string;
  };
}

// ========================================
// CORE API FUNCTIONS
// ========================================

export const getStudies = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  createdBy?: string;
}): Promise<StudyListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.createdBy) queryParams.append("createdBy", params.createdBy);

  const { data } = await apiClient.get(`/studies?${queryParams.toString()}`);
  return data;
};

export const getEnrolledStudies = async (walletAddress: string): Promise<StudySummary[]> => {
  try {
    const { data } = await apiClient.get(`/studies/enrolled/${walletAddress}`);
    return data.studies || [];
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.data?.studies === null) {
      return [];
    }
    throw error;
  }
};

export const getStudyDetails = async (studyId: number): Promise<StudyDetails> => {
  const { data } = await apiClient.get(`/studies/${studyId}`);
  return data.study;
};

export const createStudy = async (studyData: CreateStudyRequest): Promise<CreateStudyResponse> => {
  try {
    const response = await apiClient.post<CreateStudyResponse>("/studies", studyData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || "Network error");
  }
};

export const updateStudyStatus = async (
  studyId: number,
  updates: {
    status?: string;
    contractAddress?: string;
    deploymentTxHash?: string;
  }
) => {
  const { data } = await apiClient.patch(`/studies/${studyId}`, updates);
  return data;
};

export const deployStudy = async (studyId: number) => {
  const { data } = await apiClient.post(`/studies/${studyId}/deployment`);
  return data;
};

export const deleteStudy = async (studyId: number, walletId: string) => {
  const { data } = await apiClient.delete(`/studies/${studyId}`, {
    data: { walletId },
  });
  return data;
};
export interface StudyApplicationRequest {
  studyId: number;
  participantWallet: string;
  proofJson: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicInputsJson: string[];
  dataCommitment: string;
}

export class StudyApplicationService {
  static async applyToStudy(
    studyId: number,
    medicalData: ExtractedMedicalData,
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Fetching study criteria");
      const studyCriteria = await this.getStudyCriteria(studyId);

      console.log("Checking eligibility...");
      const isEligible = checkEligibility(medicalData, studyCriteria);

      if (!isEligible) {
        console.log("Eligibility criteria not met. Logging failed attempt...");
        try {
          await apiClient.post("/audit/log-failed-join", {
            userAddress: walletAddress,
            studyId: studyId.toString(),
            reason: "Eligibility criteria not met",
            errorDetails: "User medical data does not match study requirements",
            metadata: {
              stage: "client_eligibility_check",
            },
          });
          console.log("Failed join attempt logged to audit trail");
        } catch (auditError) {
          console.error("Failed to log audit entry (non-critical):", auditError);
        }

        return {
          success: false,
          message:
            "You don't meet the eligibility criteria for this study. Check console for details.",
        };
      }

      console.log("Eligibility confirmed! Proceeding with commitment and proof generation...");

      console.log("Generating data commitment");
      const salt = generateSecureSalt();
      const dataCommitment = generateDataCommitment(medicalData, salt);

      console.log("Generating ZK proof");
      const { proof, publicSignals } = await generateZKProof(
        medicalData,
        studyCriteria,
        dataCommitment,
        salt
      );

      console.log("Submitting application (no sensitive data sent)...");
      const applicationRequest: StudyApplicationRequest = {
        studyId,
        participantWallet: walletAddress,
        proofJson: proof,
        publicInputsJson: publicSignals,
        dataCommitment: dataCommitment.toString(),
      };

      await this.submitApplication(applicationRequest);

      console.log("Study application completed successfully!");

      return {
        success: true,
        message: "Successfully applied to study! Your medical data remained private.",
      };
    } catch (error) {
      console.error("Study application failed:", error);

      try {
        await apiClient.post("/audit/log-failed-join", {
          userAddress: walletAddress,
          studyId: studyId.toString(),
          reason: "Application process error",
          errorDetails: error instanceof Error ? error.message : "Unknown error",
          metadata: {
            stage: "application_process",
            errorType: error instanceof Error ? error.constructor.name : "unknown",
          },
        });
        console.log("Failed join attempt logged to audit trail");
      } catch (auditError) {
        console.error("Failed to log audit entry (non-critical):", auditError);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Application failed",
      };
    }
  }

  private static async getStudyCriteria(studyId: number): Promise<StudyCriteria> {
    console.log("Fetching criteria for study ID:", studyId);
    try {
      const response = await apiClient.get(`/studies/${studyId}/criteria`);
      console.log("Study criteria fetched:", response.data);
      return response.data.studyCriteria;
    } catch (error) {
      console.error("Failed to fetch study criteria:", error);
      throw new Error("Failed to fetch study criteria from server");
    }
  }

  private static async submitApplication(request: StudyApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.post(`/studies/${request.studyId}/participants`, request);

      console.log("Application submitted successfully! Status:", response.status);
      console.log("Response data:", response.data);
    } catch (error) {
      console.error("Failed to submit application:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.error || axiosError.message;

        console.error(`API Error - Status: ${status}, Message: ${errorMessage}`);
        throw new Error(`Failed to submit study application: ${errorMessage}`);
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to submit study application: ${errorMessage}`);
    }
  }
}

// ========================================
// REACT HOOKS
// ========================================

export const useCreateStudy = () => {
  const createStudyAsync = async (
    title: string,
    description: string,
    maxParticipants: number,
    durationDays: number,
    criteria: StudyCriteria,
    selectedTemplate?: string,
    createdBy?: string
  ): Promise<CreateStudyResponse> => {
    const studyData: CreateStudyRequest = {
      title,
      description,
      maxParticipants,
      durationDays,
      ...(selectedTemplate ? { templateName: selectedTemplate } : { customCriteria: criteria }),
      ...(createdBy ? { createdBy } : {}),
    };

    return createStudy(studyData);
  };

  return { createStudy: createStudyAsync };
};

export const revokeStudyConsent = async (
  studyId: number,
  participantWallet: string
): Promise<{ success: boolean; blockchainTxHash?: string }> => {
  try {
    const response = await apiClient.post(`/studies/${studyId}/consent/revoke`, {
      participantWallet,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to revoke consent:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      const errorMessage = axiosError.response?.data?.error || axiosError.message;
      throw new Error(`Failed to revoke consent: ${errorMessage}`);
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to revoke consent: ${errorMessage}`);
  }
};

export const grantStudyConsent = async (
  studyId: number,
  participantWallet: string
): Promise<{ success: boolean; blockchainTxHash?: string }> => {
  try {
    const response = await apiClient.post(`/studies/${studyId}/consent/grant`, {
      participantWallet,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to grant consent:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      const errorMessage = axiosError.response?.data?.error || axiosError.message;
      throw new Error(`Failed to grant consent: ${errorMessage}`);
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to grant consent: ${errorMessage}`);
  }
};

import { apiClient } from "@/services/core/apiClient";
import { ExtractedMedicalData, StudyCriteria } from "@zk-medical/shared";
import {
  checkEligibility,
  generateDataCommitment,
  generateSecureSalt,
  generateZKProof,
} from "@/services/zk/zkProofGenerator";
import { BrowserProvider } from "ethers";

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
  transactionHash?: string;
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
  binConfiguration?: any;
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
  binConfiguration?: any;
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

export const getParticipants = async (studyId: number): Promise<{ participants: string[] }> => {
  const { data } = await apiClient.get(`/studies/${studyId}/participants`);
  return data;
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

/**
 * End a study by updating its status to completed
 */
export const endStudy = async (studyId: number) => {
  const { data } = await updateStudyStatus(studyId, { status: "completed" });
  return data;
};

/**
 * Delete a study from the database
 */
export const deleteStudy = async (studyId: number, walletId: string) => {
  const { data } = await apiClient.delete(`/studies/${studyId}`, {
    data: { walletId },
  });
  return data;
};

export const getAggregatedData = async (
  studyId: number,
  creatorWallet: string
): Promise<AggregatedStudyData> => {
  const { data } = await apiClient.get(`/studies/${studyId}/aggregated-data`, {
    params: { creatorWallet },
  });
  return data;
};

export interface AggregatedBinData {
  binId: string;
  criteriaField: string;
  binType: "RANGE" | "CATEGORICAL";
  label: string;
  minValue?: number;
  maxValue?: number;
  includeMin?: boolean;
  includeMax?: boolean;
  categoriesBitmap?: number;
  count: number;
}

export interface AggregatedStudyData {
  studyId: number;
  studyTitle: string;
  totalParticipants: number;
  bins: AggregatedBinData[];
  generatedAt: number;
}

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
  binIds?: string[];
}

export class StudyApplicationService {
  static async applyToStudy(
    studyId: number,
    medicalData: ExtractedMedicalData,
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const salt = generateSecureSalt();
      const { data: challengeData } = await apiClient.post("/studies/request-challenge", {
        studyId,
        participantWallet: walletAddress,
      });

      if (!challengeData.challenge) {
        throw new Error("Challenge generation failed.");
      }

      console.log("Challenge received:", challengeData.challenge);

      const finalDataCommitment = generateDataCommitment(
        medicalData,
        salt,
        challengeData.challenge
      );
      console.log("Final data commitment (with challenge):", finalDataCommitment.toString());

      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask to continue.");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(finalDataCommitment.toString());

      const { data } = await apiClient.post("/studies/data-commitment", {
        studyId,
        participantWallet: walletAddress,
        dataCommitment: finalDataCommitment.toString(),
        challenge: challengeData.challenge,
        signature,
      });

      if (!data.success) {
        throw new Error("Data commitment generation failed.");
      }

      const studyDetails = await getStudyDetails(studyId);
      const studyCriteria = studyDetails.eligibilityCriteria;
      const binConfiguration = studyDetails.binConfiguration;

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

      const proofResult = await generateZKProof(
        medicalData,
        studyCriteria,
        finalDataCommitment,
        salt,
        challengeData.challenge,
        binConfiguration
      );

      const verifiedCommitment = proofResult.publicSignals[proofResult.publicSignals.length - 1];

      const applicationRequest: StudyApplicationRequest = {
        studyId,
        participantWallet: walletAddress,
        proofJson: proofResult.proof,
        publicInputsJson: proofResult.publicSignals,
        dataCommitment: verifiedCommitment,
        binIds: proofResult.binMembership?.binIds,
      };

      await this.submitApplication(applicationRequest);

      console.log("Study application completed successfully!");

      const eventBus = (await import("@/lib/eventBus")).default;
      eventBus.emit("studyJoinedSuccess");

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
    createdBy?: string,
    binConfiguration?: any
  ): Promise<CreateStudyResponse> => {
    const studyData: CreateStudyRequest = {
      title,
      description,
      maxParticipants,
      durationDays,
      ...(selectedTemplate ? { templateName: selectedTemplate } : { customCriteria: criteria }),
      ...(createdBy ? { createdBy } : {}),
      ...(binConfiguration ? { binConfiguration } : {}),
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

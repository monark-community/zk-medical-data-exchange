/**
 * Study Management Service
 * Consolidated service for all study-related operations
 */

import { apiClient } from "@/services/core/apiClient";
import { StudyCriteria } from "@zk-medical/shared";
import { processFHIRForStudy } from "@/services/fhir";

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
  contractAddress?: string;
  criteriasSummary: {
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

export interface ParticipationResult {
  success: boolean;
  participantId?: number;
  studyId: number;
  eligibilityProof?: {
    proof: string;
    publicSignals: string[];
  };
  errors?: string[];
}

// ========================================
// CORE API FUNCTIONS
// ========================================

/**
 * Get list of studies with optional filtering
 */
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

/**
 * Get detailed information about a specific study
 */
export const getStudyDetails = async (studyId: number): Promise<StudyDetails> => {
  const { data } = await apiClient.get(`/studies/${studyId}`);
  return data.study;
};

/**
 * Create a new study
 */
export const createStudy = async (studyData: CreateStudyRequest): Promise<CreateStudyResponse> => {
  try {
    const response = await apiClient.post<CreateStudyResponse>("/studies", studyData);
    return response.data;
  } catch (error: any) {
    // Handle axios errors
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || "Network error");
  }
};

/**
 * Update study status and deployment information
 */
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

/**
 * Deploy a study to the blockchain
 */
export const deployStudy = async (studyId: number) => {
  const { data } = await apiClient.post(`/studies/${studyId}/deployment`);
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

/**
 * Participate in a study
 */
export const participateInStudy = async (
  studyId: number,
  fhirData: any,
  walletAddress: string
): Promise<ParticipationResult> => {
  try {
    // Get study details first to get criteria
    const study = await getStudyDetails(studyId);

    // Process FHIR data for the study
    const processedData = await processFHIRForStudy(fhirData, study.eligibilityCriteria);

    const response = await apiClient.post(`/studies/${studyId}/participants`, {
      fhirData: processedData,
      walletAddress,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Participation failed");
  }
};

// ========================================
// BUSINESS LOGIC FUNCTIONS
// ========================================

/**
 * Check patient eligibility for a study using FHIR data
 * Note: Simplified implementation - full FHIR processing would be more complex
 */
export const checkPatientEligibilityForStudy = async (
  studyId: number,
  // eslint-disable-next-line no-unused-vars
  fhirData: any // Intentionally unused in simplified implementation
): Promise<{
  eligible: boolean;
  matchedCriteria: string[];
  failedCriteria: string[];
  eligibilityScore: number;
}> => {
  try {
    // Get study details to verify it exists
    await getStudyDetails(studyId);

    // Simplified implementation - full FHIR processing would be implemented here
    return {
      eligible: true,
      matchedCriteria: ["Basic validation passed"],
      failedCriteria: [],
      eligibilityScore: 100,
    };
  } catch (error: any) {
    throw new Error(`Eligibility check failed: ${error.message}`);
  }
};

/**
 * Format study criteria for display
 */
export const formatStudyCriteria = (criteria: StudyCriteria): string[] => {
  const formatted: string[] = [];

  if (criteria.enableAge) {
    formatted.push(`Age: ${criteria.minAge}-${criteria.maxAge} years`);
  }

  if (criteria.enableGender) {
    // Simple gender mapping
    const genderLabels = ["Other", "Male", "Female", "Any"];
    formatted.push(`Gender: ${genderLabels[criteria.allowedGender] || "Specified"}`);
  }

  if (criteria.enableBMI) {
    formatted.push(`BMI: ${criteria.minBMI}-${criteria.maxBMI}`);
  }

  if (criteria.enableCholesterol) {
    formatted.push(`Cholesterol: ${criteria.minCholesterol}-${criteria.maxCholesterol} mg/dL`);
  }

  if (criteria.enableDiabetes) {
    const diabetesTypes = ["None", "Type 1", "Type 2", "Unspecified", "Pre-diabetes"];
    formatted.push(`Diabetes: ${diabetesTypes[criteria.allowedDiabetes] || "Specified type"}`);
  }

  if (criteria.enableSmoking) {
    const smokingStatus = ["Never", "Current", "Former", "Any"];
    formatted.push(`Smoking: ${smokingStatus[criteria.allowedSmoking] || "Specified status"}`);
  }

  return formatted;
};

// ========================================
// REACT HOOKS
// ========================================

/**
 * Hook for study creation with proper typing and error handling
 */
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
      // Use template if selected, otherwise use custom criteria
      ...(selectedTemplate ? { templateName: selectedTemplate } : { customCriteria: criteria }),
      ...(createdBy ? { createdBy } : {}),
    };

    return createStudy(studyData);
  };

  return { createStudy: createStudyAsync };
};

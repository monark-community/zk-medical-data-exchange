/**
 * Frontend Study Management Service
 * Handles study discovery, details, and participation
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
    ageRange?: string;
    requiresGender: boolean;
    requiresDiabetes: boolean;
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

export interface ParticipationResult {
  success: boolean;
  participation?: {
    id: number;
    status: string;
    eligibilityScore?: number;
    recordedAt: string;
  };
  error?: string;
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Get list of available studies
 */
export const getStudies = async (params?: {
  status?: string;
  template?: string;
  page?: number;
  limit?: number;
}): Promise<StudyListResponse> => {
  const { data } = await apiClient.get("/studies", { params });
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
export const createNewStudy = async (studyData: {
  title: string;
  description?: string;
  maxParticipants?: number;
  durationDays?: number;
  templateName?: string;
  customCriteria?: Partial<StudyCriteria>;
  createdBy?: string;
}) => {
  const { data } = await apiClient.post("/studies", studyData);
  return data;
};

/**
 * Update study status or deployment info
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
 * Check patient eligibility for a study using FHIR data
 */
export const checkPatientEligibilityForStudy = async (
  studyId: number,
  fhirData: any
): Promise<{
  eligible: boolean;
  matchedCriteria: string[];
  missingCriteria: string[];
  zkReadyValues: Record<string, any>;
  study: StudyDetails;
}> => {
  // Get study criteria
  const study = await getStudyDetails(studyId);

  // Process FHIR data against study criteria
  const result = processFHIRForStudy(fhirData, study.eligibilityCriteria);

  if (!result.validation.isValid) {
    throw new Error(`Invalid FHIR data: ${result.validation.errors.join(", ")}`);
  }

  return {
    eligible: result.eligibility?.isEligible || false,
    matchedCriteria: result.eligibility?.matchedCriteria || [],
    missingCriteria: result.eligibility?.missingCriteria || [],
    zkReadyValues: result.eligibility?.zkReadyValues || {},
    study,
  };
};

/**
 * Submit participation in a study (after ZK proof generation)
 */
export const participateInStudy = async (
  studyId: number,
  participationData: {
    participantWallet: string;
    proofJson?: any;
    publicInputsJson?: any;
    matchedCriteria?: string[];
    eligibilityScore?: number;
  }
): Promise<ParticipationResult> => {
  try {
    const { data } = await apiClient.post(`/studies/${studyId}/participate`, participationData);
    return { success: true, participation: data.participation };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to participate in study",
    };
  }
};

// ========================================
// REACT HOOKS
// ========================================

import { useState, useEffect } from "react";

/**
 * Hook for fetching and managing study list
 */
export const useStudies = (params?: Parameters<typeof getStudies>[0]) => {
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<StudyListResponse["pagination"] | null>(null);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudies(params);
      setStudies(response.studies);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch studies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [JSON.stringify(params)]);

  return {
    studies,
    loading,
    error,
    pagination,
    refetch: fetchStudies,
  };
};

/**
 * Hook for fetching study details
 */
export const useStudyDetails = (studyId: number | null) => {
  const [study, setStudy] = useState<StudyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studyId) return;

    const fetchStudy = async () => {
      try {
        setLoading(true);
        setError(null);
        const studyData = await getStudyDetails(studyId);
        setStudy(studyData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch study details");
      } finally {
        setLoading(false);
      }
    };

    fetchStudy();
  }, [studyId]);

  return { study, loading, error };
};

/**
 * Hook for study participation workflow
 */
export const useStudyParticipation = () => {
  const [checking, setChecking] = useState(false);
  const [participating, setParticipating] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  const checkEligibility = async (studyId: number, fhirData: any) => {
    try {
      setChecking(true);
      const result = await checkPatientEligibilityForStudy(studyId, fhirData);
      setEligibilityResult(result);
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to check eligibility");
    } finally {
      setChecking(false);
    }
  };

  const participate = async (
    studyId: number,
    participationData: Parameters<typeof participateInStudy>[1]
  ) => {
    try {
      setParticipating(true);
      const result = await participateInStudy(studyId, participationData);
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to participate");
    } finally {
      setParticipating(false);
    }
  };

  return {
    checkEligibility,
    participate,
    checking,
    participating,
    eligibilityResult,
    clearEligibilityResult: () => setEligibilityResult(null),
  };
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format study criteria for display
 */
export const formatStudyCriteria = (criteria: StudyCriteria): string[] => {
  const formatted: string[] = [];

  if (criteria.enableAge) {
    formatted.push(`Age: ${criteria.minAge}-${criteria.maxAge} years`);
  }

  if (criteria.enableGender) {
    const gender =
      criteria.allowedGender === 1 ? "Male" : criteria.allowedGender === 2 ? "Female" : "Any";
    formatted.push(`Gender: ${gender}`);
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

/**
 * Get study status display info
 */
export const getStudyStatusInfo = (status: string) => {
  const statusMap = {
    draft: { label: "Draft", color: "gray", description: "Study being prepared" },
    deploying: { label: "Deploying", color: "yellow", description: "Deploying to blockchain" },
    active: { label: "Active", color: "green", description: "Accepting participants" },
    paused: { label: "Paused", color: "orange", description: "Temporarily stopped" },
    completed: { label: "Completed", color: "blue", description: "Study finished" },
  };

  return statusMap[status as keyof typeof statusMap] || statusMap.draft;
};

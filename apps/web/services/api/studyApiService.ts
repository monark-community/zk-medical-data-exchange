import { StudyCriteria } from "@zk-medical/shared";
import { apiClient } from "@/services/core/apiClient";

export interface CreateStudyRequest {
  title: string;
  description?: string;
  maxParticipants: number;
  durationDays?: number;
  templateName?: string;
  customCriteria?: Partial<StudyCriteria>;
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

/**
 * Create a new study via the API
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
 * Hook to call the study creation API
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

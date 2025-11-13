/**
 * Service for study data upload and aggregation endpoints
 */

import { apiClient } from '@/services/core/apiClient';

export interface UploadDataRequest {
  participantAddress: string;
  encryptedData: string;
  encryptionMetadata: {
    encryptedKey: string;
    iv: string;
    authTag: string;
  };
  dataHash: string;
  ipfsHash?: string;
}

export interface UploadDataResponse {
  success: boolean;
  uploadId: number;
  message: string;
  studyId: number;
  participantAddress: string;
}

export interface StudyPublicKeyResponse {
  studyId: number;
  studyTitle: string;
  publicKey: string;
  algorithm: string;
  usage: string;
}

export interface ParticipantDataStatusResponse {
  studyId: number;
  participantAddress: string;
  hasUploadedData: boolean;
  uploadedAt: string | null;
}

export interface AggregatedStatistics {
  demographics: {
    totalParticipants: number;
    ageRanges: Record<string, number>;
    genderDistribution?: Record<string, number>;
    locationDistribution?: Record<string, number>;
  };
  healthMetrics: {
    cholesterol?: {
      mean: number;
      median: number;
      stdDev: number;
      ranges: Record<string, number>;
    };
    bmi?: {
      mean: number;
      median: number;
      stdDev: number;
      ranges: Record<string, number>;
    };
    bloodPressure?: {
      systolic: { mean: number; median: number; stdDev: number };
      diastolic: { mean: number; median: number; stdDev: number };
    };
    hba1c?: {
      mean: number;
      median: number;
      stdDev: number;
    };
  };
  lifestyle: {
    smokingStatus?: Record<string, number>;
    activityLevel?: {
      mean: number;
      median: number;
      ranges: Record<string, number>;
    };
  };
  conditions: {
    diabetesDistribution?: Record<string, number>;
    heartDiseaseHistory?: Record<string, number>;
  };
  bloodTypes?: Record<string, number>;
}

export interface AggregatedDataResponse {
  studyId: number;
  studyTitle: string;
  studyDescription: string;
  participantCount: number;
  aggregatedAt: string;
  statistics: AggregatedStatistics;
  privacyMetrics: {
    kAnonymity: number;
    suppressedBins: number;
  };
}

export interface TriggerAggregationRequest {
  researcherAddress: string;
}

export interface TriggerAggregationResponse {
  success: boolean;
  message: string;
  studyId: number;
  participantCount: number;
  meetsKAnonymity: boolean;
  aggregatedAt: string;
  status: string;
}

export interface AccessLog {
  id: number;
  accessed_at: string;
  accessed_by: string;
  access_type: string;
  participant_count: number;
}

export interface AccessLogsResponse {
  studyId: number;
  logs: AccessLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Upload encrypted medical data to a study
 */
export async function uploadStudyData(
  studyId: number,
  data: UploadDataRequest
): Promise<UploadDataResponse> {
  console.log("📡 [API] uploadStudyData called:", {
    studyId,
    participantAddress: data.participantAddress,
    encryptedDataLength: data.encryptedData.length,
    dataHash: data.dataHash,
  });

  try {
    const response = await apiClient.post<UploadDataResponse>(
      `/studies/${studyId}/upload-data`,
      data
    );
    console.log("✅ [API] uploadStudyData response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ [API] uploadStudyData failed:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Get study's public key for encryption
 */
export async function getStudyPublicKey(studyId: number): Promise<StudyPublicKeyResponse> {
  console.log("📡 [API] getStudyPublicKey called:", { studyId });

  try {
    const response = await apiClient.get<StudyPublicKeyResponse>(
      `/studies/${studyId}/public-key`
    );
    console.log("✅ [API] getStudyPublicKey response:", {
      studyId: response.data.studyId,
      studyTitle: response.data.studyTitle,
      algorithm: response.data.algorithm,
      publicKeyLength: response.data.publicKey?.length,
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ [API] getStudyPublicKey failed:", {
      status: error.response?.status,
      error: error.response?.data,
    });
    throw error;
  }
}

/**
 * Check if participant has uploaded data
 */
export async function checkParticipantDataStatus(
  studyId: number,
  participantAddress: string
): Promise<ParticipantDataStatusResponse> {
  const response = await apiClient.get<ParticipantDataStatusResponse>(
    `/studies/${studyId}/participant-data-status`,
    {
      params: { participantAddress },
    }
  );
  return response.data;
}

/**
 * Trigger data aggregation for ended study
 */
export async function triggerDataAggregation(
  studyId: number,
  data: TriggerAggregationRequest
): Promise<TriggerAggregationResponse> {
  const response = await apiClient.post<TriggerAggregationResponse>(
    `/studies/${studyId}/aggregate-data`,
    data
  );
  return response.data;
}

/**
 * Get aggregated statistics for ended study
 */
export async function getAggregatedData(
  studyId: number,
  researcherAddress: string
): Promise<AggregatedDataResponse> {
  const response = await apiClient.get<AggregatedDataResponse>(
    `/studies/${studyId}/aggregated-data`,
    {
      params: { researcherAddress },
    }
  );
  return response.data;
}

/**
 * Get access logs for study
 */
export async function getAccessLogs(
  studyId: number,
  researcherAddress: string,
  limit = 50,
  offset = 0
): Promise<AccessLogsResponse> {
  const response = await apiClient.get<AccessLogsResponse>(
    `/studies/${studyId}/access-logs`,
    {
      params: { researcherAddress, limit, offset },
    }
  );
  return response.data;
}

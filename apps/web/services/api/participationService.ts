/**
 * Participation Service
 * Handles fetching user's study participations
 */

import { apiClient } from "@/services/core/apiClient";

export interface ParticipationInfo {
  id: string;
  studyId: number;
  studyTitle: string;
  studyDescription: string;
  studyStatus: string;
  studyParticipants: {
    current: number;
    max: number;
  };
  participationStatus: string;
  joinedAt: string;
  verifiedAt?: string;
  eligibilityScore?: number;
  matchedCriteria?: string[];
  contractAddress?: string;
}

export interface ParticipationsResponse {
  success: boolean;
  participations: ParticipationInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ParticipationStatusResponse {
  hasParticipated: boolean;
  participation: {
    id: string;
    status: string;
    joinedAt: string;
    verifiedAt?: string;
    eligibilityScore?: number;
  } | null;
}

/**
 * Get all studies a user has participated in
 */
export const getUserParticipations = async (
  walletAddress: string,
  options?: {
    status?: string;
    limit?: number;
    page?: number;
  }
): Promise<ParticipationsResponse> => {
  const params = new URLSearchParams();
  if (options?.status) params.append("status", options.status);
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.page) params.append("page", options.page.toString());

  const queryString = params.toString();
  const url = `/user/${walletAddress}/participations${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<ParticipationsResponse>(url);
  return response.data;
};

/**
 * Check if a user has participated in a specific study
 */
export const checkParticipationStatus = async (
  studyId: number,
  walletAddress: string
): Promise<ParticipationStatusResponse> => {
  const response = await apiClient.get<ParticipationStatusResponse>(
    `/studies/${studyId}/check-participation?wallet=${walletAddress}`
  );
  return response.data;
};

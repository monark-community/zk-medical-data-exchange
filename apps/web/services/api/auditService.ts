/* eslint-disable no-unused-vars */
/**
 * Audit Service
 * Handles API calls to audit endpoints for retrieving user audit logs
 */

import { apiClient } from "@/services/core/apiClient";
import { UserProfile } from "@zk-medical/shared";

// ========================================
// TYPES
// ========================================

export enum ActionType {
  // COMMON
  USER_AUTHENTICATION = 0,
  PROPOSAL_CREATION = 1,
  VOTE_CAST = 2,
  PROPOSAL_REMOVAL = 3,
  USERNAME_CHANGE = 4,
  // RESEARCHER ACTIONS
  STUDY_CREATION = 5,
  STUDY_STATUS_CHANGE = 6,
  STUDY_AGGREGATED_DATA_ACCESS = 7,
  PERMISSION_CHANGE = 8,
  // DATA SELLER ACTIONS
  STUDY_PARTICIPATION = 9,
  STUDY_CONSENT_REVOKED = 10,
  STUDY_CONSENT_GRANTED = 11,
  DATA_UPLOAD = 12,
  DATA_ACCESS = 13,
  DATA_DELETED = 14,
  // ADMIN
  ADMIN_ACTION = 15,
  SYSTEM_CONFIG = 16,
}

export interface AuditRecord {
  id: number;
  user: string;
  userProfile: UserProfile;
  actionType: ActionType;
  resource: string;
  action: string;
  success: boolean;
  metadata: string;
  timestamp: number;
  dataHash: string;
}

export interface PaginationInfo {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface AuditResponse {
  success: boolean;
  data: {
    userAddress: string;
    profile?: string;
    records?: AuditRecord[];
    actions?: AuditRecord[];
    count?: number;
    pagination?: PaginationInfo;
  };
  error?: string;
}

export interface AuditInfoResponse {
  success: boolean;
  data: {
    profiles: Array<{ name: string; value: number }>;
    actionTypes: Array<{ name: string; value: number }>;
  };
  error?: string;
}

// ========================================
// API FUNCTIONS
// ========================================

export const getAuditInfo = async (): Promise<AuditInfoResponse> => {
  try {
    const response = await apiClient.get("/audit/info");
    return response.data;
  } catch (error: any) {
    console.error("Error in getAuditInfo:", error);
    return {
      success: false,
      data: {
        profiles: [],
        actionTypes: [],
      },
      error: error.response?.data?.error || error.message || "Failed to fetch audit info",
    };
  }
};

export const getAllUserActions = async (
  userAddress: string,
  limit: number = 100
): Promise<AuditResponse> => {
  try {
    const response = await apiClient.get(`/audit/user/${userAddress}/actions`, {
      params: { limit },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error in getAllUserActions:", error);
    return {
      success: false,
      data: {
        userAddress,
        actions: [],
        count: 0,
      },
      error: error.response?.data?.error || error.message || "Failed to fetch user actions",
    };
  }
};

export const getUserActionsByProfile = async (
  userAddress: string,
  profile: UserProfile,
  limit: number = 100
): Promise<AuditResponse> => {
  const response = await apiClient.get(`/audit/user/${userAddress}/profile/${profile}/actions`, {
    params: { limit },
  });
  return response.data;
};

export const getUserActionsByProfilePaginated = async (
  userAddress: string,
  profile: UserProfile,
  offset: number = 0,
  limit: number = 100,
  latestFirst: boolean = true
): Promise<AuditResponse> => {
  try {
    const response = await apiClient.get(
      `/audit/user/${userAddress}/profile/${profile}/actions/paginated`,
      {
        params: { offset, limit, latestFirst },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error in getUserActionsByProfilePaginated:", {
      userAddress,
      profile,
      offset,
      limit,
      latestFirst,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return {
      success: false,
      data: {
        userAddress,
        records: [],
        pagination: {
          offset,
          limit,
          total: 0,
          hasMore: false,
        },
      },
      error: error.response?.data?.error || error.message || "Failed to fetch audit records",
    };
  }
};

export const getAuditRecord = async (recordId: number): Promise<AuditResponse> => {
  const response = await apiClient.get(`/audit/record/${recordId}`);
  return response.data;
};

export const logFileAccess = async (
  userAddress: string,
  encryptedCID: string,
  accessType: "view" | "download",
  success: boolean = true,
  resourceType?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[AUDIT] Starting ${accessType} log request ${requestId}`, {
    userAddress,
    encryptedCID: encryptedCID.substring(0, 10) + "...",
    accessType,
    success,
    resourceType,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.post("/audit/log-access", {
      userAddress,
      encryptedCID,
      accessType,
      success,
      resourceType,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        requestId,
        ...metadata,
      },
    });

    console.log(`[AUDIT] Successfully logged ${accessType} request ${requestId}`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[AUDIT] Error logging ${accessType} request ${requestId}:`, error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to log file access",
    };
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const getProfileName = (profile: UserProfile): string => {
  return UserProfile[profile] || "Unknown";
};

export const getActionTypeName = (actionType: ActionType): string => {
  return ActionType[actionType] || "Unknown";
};

export const formatAuditTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const getSuccessStatusClass = (success: boolean): string => {
  return success
    ? "text-green-600 bg-green-50 border-green-200"
    : "text-red-600 bg-red-50 border-red-200";
};

export const getProfileClass = (profile: UserProfile): string => {
  switch (profile) {
    case UserProfile.RESEARCHER:
      return "text-blue-700 border-blue-200";
    case UserProfile.DATA_SELLER:
      return "text-green-700 border-green-200";
    case UserProfile.ADMIN:
      return "text-red-700 border-red-200";
    case UserProfile.COMMON:
      return "text-purple-700 border-purple-200";
    default:
      return "text-gray-700 border-gray-200";
  }
};

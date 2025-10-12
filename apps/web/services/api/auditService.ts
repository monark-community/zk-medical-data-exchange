/**
 * Audit Service
 * Handles API calls to audit endpoints for retrieving user audit logs
 */

import { apiClient } from "@/services/core/apiClient";

// ========================================
// TYPES
// ========================================

export enum UserProfile {
  RESEARCHER = 0,
  DATA_SELLER = 1,
  ADMIN = 2,
  COMMON = 3,
}

export enum ActionType {
  // COMMON
  USER_AUTHENTICATION = 0,
  PROPOSAL_CREATION = 1,
  VOTE_CAST = 2,
  PROPOSAL_REMOVAL = 3,
  // RESEARCHER ACTIONS
  STUDY_CREATION = 4,
  STUDY_STATUS_CHANGE = 5,
  STUDY_AGGREGATED_DATA_ACCESS = 6,
  PERMISSION_CHANGE = 7,
  // DATA SELLER ACTIONS
  STUDY_PARTICIPATION = 8,
  STUDY_CONSENT_REVOKED = 9,
  DATA_UPLOAD = 10,
  DATA_ACCESS = 11,
  DATA_DELETED = 12,
  // ADMIN
  ADMIN_ACTION = 13,
  SYSTEM_CONFIG = 14,
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

/**
 * Get audit system information (profiles and action types)
 */
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

/**
 * Get all user actions across all profiles
 */
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

/**
 * Get user actions for a specific profile (including COMMON actions)
 */
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

/**
 * Get paginated user actions for a specific profile (including COMMON actions)
 */
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

    // Return a consistent error response
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

/**
 * Get profile-specific actions only (excludes COMMON actions)
 */
export const getUserProfileActionsOnly = async (
  userAddress: string,
  profile: UserProfile,
  offset: number = 0,
  limit: number = 100,
  latestFirst: boolean = true
): Promise<AuditResponse> => {
  const response = await apiClient.get(
    `/audit/user/${userAddress}/profile/${profile}/actions/profile-only`,
    {
      params: { offset, limit, latestFirst },
    }
  );
  return response.data;
};

/**
 * Get a specific audit record by ID
 */
export const getAuditRecord = async (recordId: number): Promise<AuditResponse> => {
  const response = await apiClient.get(`/audit/record/${recordId}`);
  return response.data;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get human-readable profile name
 */
export const getProfileName = (profile: UserProfile): string => {
  return UserProfile[profile] || "Unknown";
};

/**
 * Get human-readable action type name
 */
export const getActionTypeName = (actionType: ActionType): string => {
  return ActionType[actionType] || "Unknown";
};

/**
 * Format timestamp to readable date
 */
export const formatAuditTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Get CSS class for action success status
 */
export const getSuccessStatusClass = (success: boolean): string => {
  return success
    ? "text-green-600 bg-green-50 border-green-200"
    : "text-red-600 bg-red-50 border-red-200";
};

/**
 * Get CSS class for user profile
 */
export const getProfileClass = (profile: UserProfile): string => {
  switch (profile) {
    case UserProfile.RESEARCHER:
      return "text-blue-600 bg-blue-50 border-blue-200";
    case UserProfile.DATA_SELLER:
      return "text-green-600 bg-green-50 border-green-200";
    case UserProfile.ADMIN:
      return "text-purple-600 bg-purple-50 border-purple-200";
    case UserProfile.COMMON:
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

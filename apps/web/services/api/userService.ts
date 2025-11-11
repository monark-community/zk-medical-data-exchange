import { User } from "@/interfaces/user";
import { apiClient } from "@/services/core/apiClient";
import { UserProfile } from "@zk-medical/shared";

export interface DataSellerStats {
  nActiveStudies: number;
  nCompletedStudies: number;
  nMedicalFiles: number;
  totalEarnings: number;
}

export interface ResearcherStats {
  nActiveStudies: number;
  nParticipantsEnrolled: number;
  nCompletedStudies: number;
  totalSpent: number;
}

export type UserStats = DataSellerStats | ResearcherStats;

export const getUser = async (walletAddress: string): Promise<User> => {
  try {
    if (!walletAddress) throw new Error("Missing wallet address");
    const response = await apiClient.get(`/user/${walletAddress}`);
    const user = response.data;

    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  } catch (error: any) {
    console.error("Error in getUser:", error?.response?.data || error.message);
    throw error;
  }
};

export const updateUser = async (
  walletAddress: string,
  updatedInfo: Partial<User>
): Promise<User> => {
  try {
    if (!walletAddress) throw new Error("Missing wallet address");
    if (!updatedInfo) throw new Error("Missing updated user information");

    const response = await apiClient.patch(`/user/${walletAddress}`, updatedInfo);
    const updatedUser = response.data;

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      createdAt: updatedUser.created_at,
    };
  } catch (error: any) {
    console.error("Error in updateUser:", error?.response?.data || error.message);
    throw error;
  }
};

export const getUserStats = async (
  walletAddress: string,
  profile: UserProfile
): Promise<UserStats> => {
  try {
    if (!walletAddress) throw new Error("Missing wallet address");

    const profileString = UserProfile[profile];

    const response = await apiClient.get(`/user/stats/${walletAddress}/${profileString}`);
    return response.data;
  } catch (error: any) {
    console.error("Error in getUserStats:", error?.response?.data || error.message);
    throw error;
  }
};

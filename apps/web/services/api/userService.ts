import { User } from "@/interfaces/user";
import { apiClient } from "@/services/core/apiClient";

export const getUser = async (walletAddress: string): Promise<User> => {
  try {
    if (!walletAddress) throw new Error("Missing wallet address");
    const response = await apiClient.get(`/users/${walletAddress}`);
    const user = response.data;

    // Adapt keys if needed (depends on your backend response shape)
    return {
      id: user.id,
      username: user.username,
      createdAt: user.created_at,
    };
  } catch (error: any) {
    console.error("Error in getUser:", error?.response?.data || error.message);
    throw error;
  }
};

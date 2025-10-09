import { User } from "@/interfaces/user";
import { apiClient } from "@/services/core/apiClient";

export const getUser = async (walletAdress: string): Promise<User> => {
  const response = await apiClient.get(`/users/${walletAdress}`);
  return response.data.map((item: any) => ({
    id: item.id,
    username: item.username,
    createdAt: item.created_at,
  }));
};

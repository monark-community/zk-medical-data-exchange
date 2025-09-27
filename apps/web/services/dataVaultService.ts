import { MedicalData } from "@/interfaces/medicalData";
import { apiClient } from "./apiClient";

export const uploadMedicalData = async (
  wallet_address: string,
  encrypted_cid: string,
  resource_type: string
) => {
  const response = await apiClient.post("/medical-data", {
    wallet_address,
    encrypted_cid,
    resource_type,
  });
  return response.data;
};

export const fetchCIDs = async (wallet_address: string): Promise<MedicalData[]> => {
  const response = await apiClient.get("/medical-data", {
    params: { wallet_address },
  });
  return response.data.map((item: any) => ({
    encryptedCid: item.encrypted_cid,
    resourceType: item.resource_type,
    createdAt: item.created_at,
  }));
};

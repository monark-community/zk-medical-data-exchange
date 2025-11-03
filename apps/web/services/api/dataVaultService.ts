import { MedicalData } from "@/interfaces/medicalData";
import { apiClient } from "@/services/core/apiClient";

export const uploadMedicalData = async (
  walletAddress: string,
  encryptedCid: string,
  resourceType: string,
  fileId: string
) => {
  const response = await apiClient.post("/medical-data", {
    wallet_address: walletAddress,
    encrypted_cid: encryptedCid,
    resource_type: resourceType,
    file_id: fileId,
  });
  return response.data;
};

export const fetchCIDs = async (walletAddress: string): Promise<MedicalData[]> => {
  const response = await apiClient.get("/medical-data", {
    params: { wallet_address: walletAddress },
  });
  return response.data.map((item: any) => ({
    encryptedCid: item.encrypted_cid,
    resourceType: item.resource_type,
    createdAt: item.created_at,
    fileId: item.file_id,
  }));
};

export const deleteCID = async (wallet_address: string, encrypted_cid: string) => {
  const response = await apiClient.delete("/medical-data", {
    data: { wallet_address, encrypted_cid },
  });
  return response.data;
};

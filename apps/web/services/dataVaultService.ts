import { DataVault } from "@/constants/dataVault";
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

export const fetchCIDs = async (wallet_address: string): Promise<DataVault[]> => {
  const response = await apiClient.get("/medical-data", {
    params: { wallet_address },
  });
  return response.data;
};

export const deleteCID = async (wallet_address: string, encrypted_cid: string) => {
  const response = await apiClient.delete("/medical-data", {
    data: { wallet_address, encrypted_cid },
  });
  return response.data;
};

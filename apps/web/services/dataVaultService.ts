import { DataVault } from "@/constants/dataVault";
import { apiClient } from "./apiClient";

export const uploadMedicalData = async (
  wallet_address: string,
  encrypted_cid: string,
  record_type: string
) => {
  const response = await apiClient.post("/medical-data", {
    wallet_address,
    encrypted_cid,
    record_type,
  });
  return response.data;
};

export const fetchCIDs = async (wallet_address: string): Promise<DataVault[]> => {
  const response = await apiClient.get("/medical-data", {
    params: { wallet_address },
  });
  return response.data;
};

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

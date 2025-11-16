import { apiClient } from "@/services/core/apiClient";

export const verifyTransaction = async (
  transactionHash: string,
  studyId: number
): Promise<{ verified: boolean; reasons: string[] }> => {
  console.log("Verifying transaction:", { transactionHash, studyId });
  try {
    const response = await apiClient.post("/transaction/verify", {
      data: { transactionHash, studyId },
    });

    const verified = Boolean(response.data?.success ?? true);
    const reasons = response.data?.reasons ?? ["success"];
    return { verified, reasons };
  } catch (error: any) {
    const message = error?.response?.data?.error || error.message || "Unknown error";
    throw new Error(`Failed to verify transaction: ${message}`);
  }
};

export const getTransactionsByStudyId = async (studyId: number) => {
  try {
    const response = await apiClient.get(`/transaction/study/${studyId}`);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.error || error.message || "Unknown error";
    throw new Error(`Failed to fetch transactions: ${message}`);
  }
};

export const getTransactionByWalletAddress = async (walletAddress: string) => {
  try {
    const response = await apiClient.get(`/transaction/wallet/${walletAddress}`);
    return response.data.transactions.map((tx: any) => ({
      id: tx.id,
      fromWallet: tx.from_wallet,
      toWallet: tx.to_wallet,
      value: tx.value,
      valueUsd: tx.value_usd,
      studyId: tx.study_id,
      createdAt: tx.created_at,
      transactionHash: tx.transaction_hash,
    }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error.message || "Unknown error";
    throw new Error(`Failed to fetch transactions: ${message}`);
  }
};

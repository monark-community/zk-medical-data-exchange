export type Transaction = {
  id: number;
  fromWallet: string;
  toWallet: string;
  valueUsd: number;
  value: number;
  studyId: number;
  createdAt: string;
  transactionHash: string;
};

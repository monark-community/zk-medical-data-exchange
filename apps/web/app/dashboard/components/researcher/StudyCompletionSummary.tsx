"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle,
  Users,
  DollarSign,
  Database,
  ExternalLink,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { Config } from "@/config/config";
import { getTransactionsByStudyId } from "@/services/api/transactionService";
import { getAggregatedData } from "@/services/api/studyService";
import { apiClient } from "@/services/core";

interface StudyCompletionSummaryProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  studyTitle: string;
  studyId: number;
  transactionHash: string;
  currentParticipants: number;
  durationDays: number | undefined;
  creatorWallet: string;
  onAccessData: () => void;
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(Config.SEPOLIA_RPC_URL),
});

export default function StudyCompletionSummary({
  open,
  onOpenChange,
  studyTitle,
  studyId,
  transactionHash,
  currentParticipants,
  durationDays,
  creatorWallet,
  onAccessData,
}: StudyCompletionSummaryProps) {
  const [txInfo, setTxInfo] = useState<{
    hash: `0x${string}`;
    from: `0x${string}`;
    to: `0x${string}` | null;
    valueUsd: string;
    blockNumber?: bigint;
    gasUsed?: bigint;
    participantsCount?: number;
    createdAt?: string;
  } | null>(null);
  const [dataPointsCollected, setDataPointsCollected] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true);
        const hash = transactionHash as `0x${string}`;

        const tx = await publicClient.getTransaction({ hash });
        const receipt = await publicClient.getTransactionReceipt({ hash });

        const transactions = await getTransactionsByStudyId(studyId);
        const totalUsd = transactions.transactions.reduce(
          (acc: number, t: any) => acc + Number(t.value_usd ?? 0),
          0
        );

        setTxInfo({
          hash,
          from: tx.from,
          to: tx.to ?? null,
          valueUsd: totalUsd.toFixed(2),
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed,
          participantsCount: currentParticipants,
          createdAt: transactions?.transactions[0]?.created_at
            ? new Date(transactions.transactions[0].created_at).toLocaleDateString()
            : undefined,
        });
      } catch (err: any) {
        console.error("Failed to fetch tx info:", err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTx();
    }
  }, [transactionHash, studyId, currentParticipants, open]);

  useEffect(() => {
    const fetchDataPoints = async () => {
      try {
        const aggregatedData = await getAggregatedData(studyId, creatorWallet);
        
        const uniqueFields = new Set(aggregatedData.bins.map(bin => bin.criteriaField));
        const dataPoints = aggregatedData.totalParticipants * uniqueFields.size;
        
        setDataPointsCollected(dataPoints);
      } catch (err: any) {
        console.error("Failed to fetch data points:", err);
        setDataPointsCollected(0);
      }
    };

    if (open) {
      fetchDataPoints();
    }
  }, [studyId, creatorWallet, open]);

  const studyDuration = durationDays ? `${durationDays} days` : "N/A";

  const handleAccessData = async () => {
    try {
      setLoadingData(true);
      console.log("Accessing study data...");

      // Log data access for audit trail
      await apiClient.post(`/studies/${studyId}/data-access`, {
        creatorWallet: creatorWallet,
      });

      console.log("Data access logged successfully");

      onAccessData();
    } catch (error) {
      console.error("Failed to access study data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleViewTransaction = () => {
    if (txInfo?.hash) {
      window.open(`https://sepolia.etherscan.io/tx/${txInfo.hash}`, "_blank", "noopener");
    }
  };

  const participantsCount = txInfo?.participantsCount ?? 0;
  const totalUsdNum = Number(txInfo?.valueUsd ?? 0);
  const perParticipantUsd =
    participantsCount > 0 ? (totalUsdNum / participantsCount).toFixed(2) : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {loadingData && (
          <div className="absolute inset-0 bg-background/95 z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-200 opacity-20"></div>
                <Spinner className="h-16 w-16 text-emerald-600" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="h-3 w-3 bg-emerald-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Aggregated Data
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Retrieving participant statistics and bin distributions from the blockchain...
                </p>
                <div className="flex items-center justify-center gap-1 pt-2">
                  <div className="h-2 w-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            Study Successfully Completed
          </DialogTitle>
          <p className="text-center text-sm text-gray-600 mt-2">{studyTitle}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 opacity-20"></div>
              <Spinner className="h-16 w-16 text-indigo-600" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="h-3 w-3 bg-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Loading Study Summary
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Retrieving transaction details and study metrics from the blockchain...
              </p>
              <div className="flex items-center justify-center gap-1 pt-2">
                <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <span>Key Metrics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Total Participants</p>
                        <p className="text-2xl font-bold text-gray-900">{participantsCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-center space-x-3">
                      <Database className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900">{dataPointsCollected}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-8 w-8 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Study Duration</p>
                        <p className="text-xl font-bold text-gray-900">{studyDuration}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${txInfo?.valueUsd ?? "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                <h3 className="font-semibold text-gray-900 mb-3">Study Data Access</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your study data is now ready for analysis. Access the collected anonymized data
                  and export reports.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleAccessData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Access Study Data
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4 h-full">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <span>Completion Details</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Completion Date:</span>
                      <span className="font-medium text-gray-900 text-right">
                        {txInfo?.createdAt ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Transaction Hash:</span>
                      <button
                        onClick={handleViewTransaction}
                        className="font-mono text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{txInfo?.hash.slice(0, 20)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gas Fees:</span>
                      <span className="font-medium text-gray-900">
                        {txInfo?.gasUsed?.toString() ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Participant Compensation:</span>
                      <span className="font-medium text-gray-900">${perParticipantUsd}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Blockchain Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium text-gray-900">Sepolia Testnet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Block Number:</span>
                        <span className="font-medium text-gray-900">
                          {txInfo?.blockNumber?.toString() ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Data Collection Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Records:</span>
                        <span className="font-medium text-gray-900">{dataPointsCollected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Anonymized:</span>
                        <span className="font-medium text-green-600">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="!flex-row !justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="min-w-[150px] bg-gray-900 hover:bg-gray-800"
          >
            Close
          </Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

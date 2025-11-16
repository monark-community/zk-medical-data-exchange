"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Users,
  DollarSign,
  Database,
  ExternalLink,
  Download,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { Config } from "@/config/config";
import { getTransactionsByStudyId } from "@/services/api/transactionService";

interface StudyCompletionSummaryProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  studyTitle: string;
  studyId: number;
  transactionHash: string;
  currentParticipants: number;
  durationDays: number | undefined;
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

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const hash = transactionHash as `0x${string}`;

        const tx = await publicClient.getTransaction({ hash });
        const receipt = await publicClient.getTransactionReceipt({ hash });
        console.log("tx:", tx);
        console.log("receipt:", receipt);

        const transactions = await getTransactionsByStudyId(studyId);
        console.log("transactions:", transactions);
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
      }
    };

    fetchTx();
  }, [transactionHash, studyId, currentParticipants]);

  // TODO: Fetch datapoints and duration from backend
  const dataPointsCollected = 1248;
  const studyDuration = durationDays ? `${durationDays} days` : "N/A";

  const handleAccessData = () => {
    // TODO: Implement data access functionality
    console.log("Accessing study data...");
  };

  const handleViewTransaction = () => {
    if (txInfo?.hash) {
      window.open(`https://sepolia.etherscan.io/tx/${txInfo.hash}`, "_blank", "noopener");
    }
  };

  const handleExportSummary = () => {
    // TODO: Export summary as PDF/CSV
    console.log("Exporting summary...");
  };

  const participantsCount = txInfo?.participantsCount ?? 0;
  const totalUsdNum = Number(txInfo?.valueUsd ?? 0);
  const perParticipantUsd =
    participantsCount > 0 ? (totalUsdNum / participantsCount).toFixed(2) : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
                  <Button variant="outline" onClick={handleExportSummary}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Summary
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
                        className="font-mono text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                      >
                        <span>{txInfo?.hash}...</span>
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
                        <span className="font-medium text-gray-900">1,248</span>
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
      </DialogContent>
    </Dialog>
  );
}

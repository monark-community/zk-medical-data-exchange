"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Database, CheckCircle } from "lucide-react";
import { endStudy, getParticipants } from "@/services/api/studyService";
import { disperseEthEqual } from "@/utils/disperseEth";
import { sepolia } from "viem/chains";
import { http } from "viem";
import { createConfig } from "wagmi";
import { Config } from "@/config/config";
import { verifyTransaction } from "@/services/api/transactionService";

interface EndStudyDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  studyTitle: string;
  studyId: number;
  onStudyEnded?: () => void;
}

export default function EndStudyDialog({
  open,
  onOpenChange,
  studyTitle,
  studyId,
  onStudyEnded,
}: EndStudyDialogProps) {
  const [isEnding, setIsEnding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCancel = () => {
    if (!isEnding) {
      onOpenChange(false);
    }
  };

  const handleProceed = async () => {
    setIsEnding(true);
    let transactionHash: `0x${string}` = "0x";
    const { participants } = await getParticipants(studyId);

    if (participants.length === 0) {
      await endStudy(studyId);
      setShowSuccess(true);
      setIsEnding(false);
      setShowSuccess(false);
      onOpenChange(false);
      onStudyEnded?.();
      return;
    }

    try {
      const config = createConfig({
        chains: [sepolia],
        transports: {
          [sepolia.id]: http(Config.SEPOLIA_RPC_URL),
        },
      });

      const { hash } = await disperseEthEqual({
        config,
        contractAddress: Config.DISPERSE_ADDRESS as `0x${string}`,
        recipients: participants as `0x${string}`[],
        amountEachEth: 0.001,
      });
      transactionHash = hash;
    } catch (error) {
      console.error("Failed to disperse ETH to participants:", error);
      setIsEnding(false);
      alert("Failed to disperse ETH. Please try again.");
      return;
    }

    try {
      const result = await verifyTransaction(transactionHash, studyId);

      if (!result.verified) {
        console.log("Transaction verification failed:", result.reasons);
        throw new Error("Transaction could not be verified");
      }

      setShowSuccess(true);
      setTimeout(() => {
        setIsEnding(false);
        setShowSuccess(false);
        onOpenChange(false);
        onStudyEnded?.();
      }, 2000);
    } catch (error) {
      console.error("Transaction verification failed:", error);
      setIsEnding(false);
      alert("Failed to verify transaction. Please try again.");
      return;
    }
  };
  // Placeholder values - will be replaced with actual data later
  const enrolledUsers = 42;
  const dataAccessCount = 156;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg">
        {/* Loading Overlay */}
        {isEnding && !showSuccess && (
          <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Ending Study</h3>
              <p className="text-muted-foreground">
                Please wait while we finalize the study completion...
              </p>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-background z-50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Study Completed!</h3>
              <p className="text-muted-foreground">
                The study has been successfully marked as completed.
              </p>
            </div>
          </div>
        )}

        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <DialogTitle className="text-xl font-bold text-gray-900">Warning</DialogTitle>
          </div>
          <DialogDescription className="text-base font-semibold text-gray-900 !mt-3">
            You are about to end the study titled &quot;{studyTitle}&quot;. This action is
            irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Before proceeding, please review the following information about this study:
          </p>

          <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Enrolled Participants</p>
                <p className="text-sm text-gray-600">{enrolledUsers} users currently enrolled</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Data Access Records</p>
                <p className="text-sm text-gray-600">
                  {dataAccessCount} data points have been collected for your study
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-900">
              <span className="font-semibold">Important:</span> Ending this study will close it to
              new participants and finalize all data collection. Participants will be notified, and
              you will no longer be able to access ongoing study data.
            </p>
          </div>
        </div>

        <DialogFooter className="!flex-row !justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="min-w-[100px]"
            disabled={isEnding}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleProceed}
            className="min-w-[100px] bg-orange-600 hover:bg-orange-700"
            disabled={isEnding}
          >
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

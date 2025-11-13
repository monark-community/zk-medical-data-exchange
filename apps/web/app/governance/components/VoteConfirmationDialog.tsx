"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleCheck, CircleMinus, AlertTriangle, CircleX } from "lucide-react";
import { vote } from "@/services/api/governanceService";
import emitter from "@/lib/eventBus";

interface VoteConfirmationDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  voteChoice: number; // 1: For, 2: Against
  proposalId: number;
  proposalTitle: string;
  walletAddress: string;
}
function normalizeVoteError(err: any): string {
  if (!err) return "Unexpected error";

  const message = err.message || err.toString();

  if (message.includes("already voted")) return "You already voted on this proposal.";
  if (message.includes("proposal closed")) return "This proposal is no longer open for voting.";

  // fallback
  return "We couldn’t process your vote. Please try again.";
}
const getVoteLabel = (voteChoice: number): string => {
  switch (voteChoice) {
    case 1:
      return "For";
    case 2:
      return "Against";
    default:
      return "Abstain";
  }
};

const getVoteIcon = (voteChoice: number) => {
  switch (voteChoice) {
    case 1:
      return <CircleCheck className="w-6 h-6 text-green-600" />;
    case 2:
      return <CircleX className="w-6 h-6 text-red-600" />;
    case 3:
      return <CircleMinus className="w-6 h-6 text-gray-600" />;
    default:
      return null;
  }
};

const getVoteColor = (voteChoice: number): string => {
  switch (voteChoice) {
    case 1:
      return "text-green-600";
    case 2:
      return "text-red-600";
    case 3:
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

export default function VoteConfirmationDialog({
  open,
  onOpenChange,
  voteChoice,
  proposalId,
  proposalTitle,
  walletAddress,
}: VoteConfirmationDialogProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmVote = async () => {
    setIsVoting(true);
    setError(null);

    try {
      const result = await vote(voteChoice, proposalId, walletAddress);

      if (result.success) {
        // Emit event to refresh proposals
        emitter.emit("proposalUpdated");

        // Close dialog
        onOpenChange(false);
      } else {
        setError(normalizeVoteError(result.error) || "Failed to submit vote");
      }
    } catch (err: any) {
      setError(normalizeVoteError(err) || "An unexpected error occurred");
    } finally {
      setIsVoting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isVoting) {
      // Prevent closing while voting
      return;
    }
    setError(null);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Loading Overlay */}
        {isVoting && (
          <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-primary mx-auto mb-4"
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
              <h3 className="text-lg font-semibold mb-2">Submitting Your Vote</h3>
              <p className="text-muted-foreground text-sm">
                Please wait while we record your vote on the blockchain...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-orange-100">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Confirm Your Vote</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Please review your voting choice carefully.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Proposal Title */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Proposal</p>
            <p className="font-medium text-gray-900">{proposalTitle}</p>
          </div>

          {/* Vote Choice */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Your Vote</p>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {getVoteIcon(voteChoice)}
              <span className={`text-lg font-semibold ${getVoteColor(voteChoice)}`}>
                {getVoteLabel(voteChoice)}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">
                  This action is not reversible
                </p>
                <p className="text-xs text-orange-700">
                  Once submitted, your vote cannot be changed or withdrawn. Please ensure you are
                  voting according to your preference.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Vote Failed</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isVoting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmVote}
            disabled={isVoting}
            className={
              voteChoice === 1
                ? "bg-green-600 hover:bg-green-700"
                : voteChoice === 2
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-600 hover:bg-gray-700"
            }
          >
            {isVoting ? "Voting..." : "Confirm Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

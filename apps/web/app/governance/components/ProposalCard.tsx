import { Proposal, ProposalCategory } from "@/interfaces/proposal";
import { CircleCheck, CircleMinus, CircleX, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import VoteConfirmationDialog from "@/app/governance/components/VoteConfirmationDialog";
import { useTxStatusState } from "@/hooks/useTxStatus";
import { getPlatformUserCount } from "@/services/api/userService";

interface ProposalCardProps {
  proposalInfo: Proposal;
  isLast: boolean;
  statusBadge: React.ReactNode;
  actionButtons?: React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
  onVoteFor?: () => void;
  onVoteAgainst?: () => void;
}

const getCategoryLabel = (category: ProposalCategory): string => {
  switch (category) {
    case ProposalCategory.Economics:
      return "Economics";
    case ProposalCategory.Privacy:
      return "Privacy";
    case ProposalCategory.Governance:
      return "Governance";
    case ProposalCategory.Policy:
      return "Policy";
    case ProposalCategory.Other:
      return "Other";
    default:
      return "Other";
  }
};
const getVoteLabel = (vote: number): string => {
  switch (vote) {
    case 1:
      return "For";
    case 2:
      return "Against";
    default:
      return "Abstain";
  }
};
const getCategoryColor = (category: ProposalCategory): string => {
  switch (category) {
    case ProposalCategory.Economics:
      return "bg-purple-100 text-purple-700";
    case ProposalCategory.Privacy:
      return "bg-blue-100 text-blue-700";
    case ProposalCategory.Governance:
      return "bg-green-100 text-green-700";
    case ProposalCategory.Policy:
      return "bg-orange-100 text-orange-700";
    case ProposalCategory.Other:
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTimeRemaining = (endTime: number): string => {
  if (endTime === null || endTime === undefined) return "Ended";

  const now = Math.floor(Date.now() / 1000);
  const remaining = Math.floor(endTime - now);

  if (remaining <= 0) return "Ended";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}${hours > 0 ? ` ${hours}h` : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes}m` : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "< 1 minute";
};

export default function ProposalCard({
  proposalInfo,
  isLast,
  statusBadge,
  descriptionMaxLength = 200,
}: ProposalCardProps) {
  // const voteForPercentage = (proposalInfo.votesFor / proposalInfo.totalVoters) * 100;
  const { address: walletAddress } = useAccount();
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number>(1);
  const { isVisible: isTxProcessing } = useTxStatusState();
  const [platformUserCount, setPlatformUserCount] = useState<number>(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      const count = await getPlatformUserCount();
      setPlatformUserCount(count);
    };
    fetchUserCount();
  }, []);

  const handleVoteClick = (voteChoice: number) => {
    setSelectedVote(voteChoice);
    setVoteDialogOpen(true);
  };
  const timeRemaining = formatTimeRemaining(proposalInfo.endTime);
  const isProposalEnded = timeRemaining === "Ended";
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow ${
        isLast ? "mb-2 sm:mb-3" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
        <div className="left-section flex-1">
          {/* Title and Description */}
          <div className="mb-2 sm:mb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
              {proposalInfo.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {proposalInfo.description.length > descriptionMaxLength
                ? `${proposalInfo.description.substring(0, descriptionMaxLength)}...`
                : proposalInfo.description}
            </p>
          </div>

          {/* Header with badges and proposer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium ${getCategoryColor(
                  proposalInfo.category
                )}`}
              >
                {getCategoryLabel(proposalInfo.category)}
              </span>
              {statusBadge}
            </div>
            {/* Proposer */}
            <div className="text-xs text-gray-500">by {shortenAddress(proposalInfo.proposer)}</div>
          </div>

          {/* Voting Progress */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700 text-sm sm:text-base">
                Voting Progress
              </span>
            </div>

            {/* Vote Counts - Responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-700">For: {proposalInfo.votesFor.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-700">
                  Against: {proposalInfo.votesAgainst.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-gray-700">
                  Abstain:{" "}
                  {(
                    platformUserCount -
                    (proposalInfo.votesAgainst + proposalInfo.votesFor)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="right-section lg:ml-6 lg:flex-shrink-0 lg:w-48 w-full">
          {/* Action Buttons */}
          <div className="flex flex-col w-full items-center gap-2 sm:gap-3">
            {/* Time Remaining */}
            <div className="bg-gray-50 w-full rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Hourglass className="w-4 h-4" />
                <span className="text-sm font-medium">Time Left</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-center">
                {formatTimeRemaining(proposalInfo.endTime)}
              </div>
            </div>

            {/* Voting Section */}
            {proposalInfo.hasVoted || isProposalEnded ? (
              <div className="flex flex-col w-full items-center gap-2">
                {proposalInfo.userVote && [1, 2, 3].includes(proposalInfo.userVote) ? (
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                      proposalInfo.userVote === 1
                        ? "bg-green-100 text-green-800"
                        : proposalInfo.userVote === 2
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {proposalInfo.userVote === 1 ? (
                      <CircleCheck className="w-4 h-4" />
                    ) : proposalInfo.userVote === 2 ? (
                      <CircleMinus className="w-4 h-4" />
                    ) : null}
                    <span>You voted {getVoteLabel(proposalInfo.userVote)}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                    <span>You didn't vote for this proposal</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col w-full items-center gap-1">
                <Button
                  onClick={() => handleVoteClick(1)}
                  variant="default"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isTxProcessing}
                >
                  <CircleCheck className="w-4 h-4 mr-2" />
                  Vote For
                </Button>
                <Button
                  onClick={() => handleVoteClick(2)}
                  variant="outline"
                  size="sm"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  disabled={isTxProcessing}
                >
                  <CircleX className="w-4 h-4 mr-2" />
                  Vote Against
                </Button>
              </div>
            )}
          </div>

          {/* Vote Confirmation Dialog */}
          {walletAddress && (
            <VoteConfirmationDialog
              open={voteDialogOpen}
              onOpenChange={setVoteDialogOpen}
              voteChoice={selectedVote}
              proposalId={proposalInfo.id}
              proposalTitle={proposalInfo.title}
              walletAddress={walletAddress}
            />
          )}
        </div>
      </div>
    </div>
  );
}

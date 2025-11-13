import { Proposal, ProposalCategory } from "@/interfaces/proposal";
import { CircleCheck, CircleMinus, CircleX, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useState } from "react";
import VoteConfirmationDialog from "@/app/governance/components/VoteConfirmationDialog";

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
    case 3:
      return "Abstain";
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

  const handleVoteClick = (voteChoice: number) => {
    setSelectedVote(voteChoice);
    setVoteDialogOpen(true);
  };
  const timeRemaining = formatTimeRemaining(proposalInfo.endTime);
  const isProposalEnded = timeRemaining === "Ended";
  return (
    <div
      className={` bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
        isLast ? "mb-3" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        <div className="left-section flex-1 mb-4 lg:mb-0">
          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{proposalInfo.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {proposalInfo.description.length > descriptionMaxLength
                ? `${proposalInfo.description.substring(0, descriptionMaxLength)}...`
                : proposalInfo.description}
            </p>
          </div>
          {/* Header with badges and proposer */}
          <div className="flex items-start justify-start mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-medium ${getCategoryColor(
                  proposalInfo.category
                )}`}
              >
                {getCategoryLabel(proposalInfo.category)}
              </span>
              {statusBadge}
            </div>
            {/* Proposer */}
            <div className="mb-3 pl-3">
              <span className="text-xs text-gray-500">
                by {shortenAddress(proposalInfo.proposer)}
              </span>
            </div>
          </div>
          {/* Voting Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 text-m">
              <span className="font-medium text-gray-700">Voting Progress</span>
            </div>

            {/* Progress Bar  ADD if Quorum implement*/}

            {/* <Progress value={voteForPercentage}  /> */}

            {/* Vote Counts */}
            <div className="flex items-center justify-between text-s">
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
                <div className="w-2 h-2 rounded-full bg-grey-500" />
                <span className="text-gray-700">
                  Abstain:{" "}
                  {(
                    proposalInfo.totalVoters -
                    (proposalInfo.votesAgainst + proposalInfo.votesFor)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="right-section lg:ml-6 lg:flex-shrink-0 lg:w-48 w-full">
          {/* Action Buttons */}

          <div className="flex flex-col w-full items-center justify-between pt-4  border-gray-100">
            <div className="bg-gray-50 w-full rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Hourglass className="w-4 h-4" />
                Time Left
              </div>
              <div className="text-2xl font-bold ">{formatTimeRemaining(proposalInfo.endTime)}</div>
            </div>
            {proposalInfo.hasVoted || isProposalEnded ? (
              <div className="flex flex-col w-full items-center gap-3">
                {proposalInfo.userVote && [1, 2, 3].includes(proposalInfo.userVote) ? (
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
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
                    ) : (
                      <Hourglass className="w-4 h-4" />
                    )}
                    <span>You voted {getVoteLabel(proposalInfo.userVote)}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                    <span>You didn't vote for this proposal</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col w-full items-center gap-2">
                <Button
                  onClick={() => handleVoteClick(1)}
                  variant="default"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CircleCheck />
                  Vote For
                </Button>
                <Button
                  onClick={() => handleVoteClick(2)}
                  variant="outline"
                  size="sm"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                >
                  <CircleX />
                  Vote Against
                </Button>
                {/* <Button
                  onClick={() => handleVoteClick(3)}
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-600 text-gray-600 hover:bg-gray-50"
                >
                  <CircleMinus />
                  Abstain
                </Button> */}
              </div>
            )}

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
    </div>
  );
}

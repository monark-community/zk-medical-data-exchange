import { Proposal, ProposalState } from "@/interfaces/proposal";
import ProposalCard from "./ProposalCard";
import { getProposalStatusColor } from "../ProposalUtils";

interface ProposalsListProps {
  proposals: Proposal[];
  // eslint-disable-next-line no-unused-vars
  renderActionButtons: (proposal: Proposal) => React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
}

/**
 * Generic component for rendering a list of proposals with customizable action buttons.
 * This component handles the common layout and styling while allowing specific implementations
 * to customize the action buttons through the renderActionButtons prop.
 */
export default function ProposalsList({
  proposals,
  renderActionButtons,
  descriptionMaxLength = 80,
}: ProposalsListProps) {
  return (
    <div id="proposal-list" className="p-4">
      <div className="space-y-3">
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={proposal.id}
            proposalInfo={proposal}
            isLast={index === proposals.length - 1}
            statusBadge={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getProposalStatusColor(
                  ProposalState[proposal.state]
                )}`}
              >
                {ProposalState[proposal.state]}
              </span>
            }
            actionButtons={renderActionButtons(proposal)}
            descriptionMaxLength={descriptionMaxLength}
          />
        ))}
      </div>
    </div>
  );
}

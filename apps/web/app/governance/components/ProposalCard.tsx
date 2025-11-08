import { Proposal } from "@/interfaces/proposal";
import { ChevronRight } from "lucide-react";

interface ProposalCardProps {
  proposalInfo: Proposal;
  isLast: boolean;
  statusBadge: React.ReactNode;
  actionButtons?: React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
}

export default function ProposalCard({
  proposalInfo,
  isLast,
  statusBadge,
  actionButtons,
  descriptionMaxLength = 80,
}: ProposalCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        isLast ? "mb-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-medium text-gray-900">{proposalInfo.title}</h4>
          {proposalInfo.description && (
            <p className="text-xs text-gray-600">
              {proposalInfo.description.length > descriptionMaxLength
                ? `${proposalInfo.description.substring(0, descriptionMaxLength)}...`
                : proposalInfo.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-3">
          {statusBadge}
          {actionButtons}
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>
              {study.currentParticipants}/{study.maxParticipants}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(study.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {study.templateName && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">
            {study.templateName}
          </span>
        )}
      </div>

      <StudyCriteriaBadges
        studyCriteriaSummary={study.criteriaSummary}
        showLabel={showCriteriaLabel}
      /> */}
    </div>
  );
}

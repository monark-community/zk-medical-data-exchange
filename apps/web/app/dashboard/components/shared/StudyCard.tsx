import { StudySummary } from "@/services/api/studyService";
import { Users, Calendar, ChevronRight } from "lucide-react";
import StudyCriteriaBadges from "@/app/dashboard/components/shared/StudyCriteriaBadges";

interface StudyCardProps {
  study: StudySummary;
  isLast: boolean;
  statusBadge: React.ReactNode;
  actionButtons?: React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
}

export default function StudyCard({
  study,
  isLast,
  statusBadge,
  actionButtons,
  descriptionMaxLength = 80,
  showCriteriaLabel = false,
}: StudyCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        !isLast ? "mb-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-medium text-gray-900">{study.title}</h4>
          {study.description && (
            <p className="text-xs text-gray-600">
              {study.description.length > descriptionMaxLength
                ? `${study.description.substring(0, descriptionMaxLength)}...`
                : study.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-3">
          {statusBadge}
          {actionButtons}
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
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
        studyCriteriaSummary={study.criteriasSummary} 
        showLabel={showCriteriaLabel}
      />
    </div>
  );
}

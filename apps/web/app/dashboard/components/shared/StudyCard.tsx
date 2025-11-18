import { StudySummary } from "@/services/api/studyService";
import { Users, Calendar, Activity, Circle, FlaskConical } from "lucide-react";
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
  const participantPercentage = (study.currentParticipants / study.maxParticipants) * 100;
  const isAlmostFull = participantPercentage >= 80;
  const isFull = participantPercentage >= 100;

  // Check if study has any criteria
  const hasAnyCriteria = study.criteriaSummary
    ? Object.values(study.criteriaSummary).some((value) => value === true)
    : false;

  // Calculate end date (creation date + duration)
  const getEndDate = () => {
    const createdDate = new Date(study.createdAt);
    if (study.durationDays) {
      const endDate = new Date(createdDate);
      endDate.setDate(endDate.getDate() + study.durationDays);
      return endDate;
    }
    return createdDate;
  };

  const displayDate = getEndDate();

  return (
    <div
      className={`group relative bg-white rounded-xl border border-gray-200 p-3 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-default ${
        !isLast ? "mb-3" : ""
      }`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-4">
          <div className="flex items-center space-x-2 mb-0.5">
            <FlaskConical className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-gray-900 leading-tight">{study.title}</h4>
          </div>
          {study.description && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {study.description.length > descriptionMaxLength
                ? `${study.description.substring(0, descriptionMaxLength)}...`
                : study.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {statusBadge}
          {actionButtons}
        </div>
      </div>

      {/* Stats Row - Compact layout */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center space-x-4">
          {/* Participants */}
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-500" />
            <span className="font-medium text-gray-900">
              {study.currentParticipants}/{study.maxParticipants}
            </span>
            <Circle
              className={`h-1.5 w-1.5 ${
                isFull
                  ? "text-red-500 fill-red-500"
                  : isAlmostFull
                  ? "text-orange-500 fill-orange-500"
                  : "text-emerald-500 fill-emerald-500"
              }`}
            />
          </div>

          {/* Activity indicator */}
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">{participantPercentage.toFixed(0)}%</span>
          </div>

          {/* End Date */}
          <div className="flex items-center space-x-1 text-gray-600">
            <Calendar className="h-3 w-3 text-gray-500" />
            <span>
              {displayDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Template badge - compact */}
        {study.templateName && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            {study.templateName}
          </span>
        )}
      </div>

      {/* Simple progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isFull ? "bg-red-500" : isAlmostFull ? "bg-orange-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(participantPercentage, 100)}%` }}
        />
      </div>

      {/* Criteria badges - only show if there are any criteria */}
      {hasAnyCriteria && (
        <div className="pt-1.5 border-t border-gray-100">
          <StudyCriteriaBadges
            studyCriteriaSummary={study.criteriaSummary}
            showLabel={showCriteriaLabel}
          />
        </div>
      )}
    </div>
  );
}

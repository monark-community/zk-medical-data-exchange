import { StudySummary } from "@/services/api/studyService";
import {
  Users,
  Calendar,
  Activity,
  Circle,
  FlaskConical,
  ExternalLink,
  Heart,
  User,
  Users as UsersIcon,
  Award,
  HeartPulse,
  UserCog,
} from "lucide-react";
import StudyCriteriaBadges from "@/app/dashboard/components/shared/StudyCriteriaBadges";
import Link from "next/link";

interface StudyCardProps {
  study: StudySummary;
  isLast: boolean;
  statusBadge: React.ReactNode;
  actionButtons?: React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
  hideTemplateBadge?: boolean;
}

export default function StudyCard({
  study,
  isLast,
  statusBadge,
  actionButtons,
  descriptionMaxLength = 80,
  showCriteriaLabel = false,
  hideTemplateBadge = false,
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

  const getStudyIcon = () => {
    if (!study.criteriaSummary) return FlaskConical;

    const { requiresAge, requiresGender, requiresLocation, requiresBloodType } =
      study.criteriaSummary;
    const hasDemographicRequirements =
      requiresAge || requiresGender || requiresLocation || requiresBloodType;

    const {
      requiresDiabetes,
      requiresHeartDisease,
      requiresBMI,
      requiresBloodPressure,
      requiresCholesterol,
      requiresHbA1c,
    } = study.criteriaSummary;
    const hasMedicalRequirements =
      requiresDiabetes ||
      requiresHeartDisease ||
      requiresBMI ||
      requiresBloodPressure ||
      requiresCholesterol ||
      requiresHbA1c;

    const { requiresSmoking, requiresActivity } = study.criteriaSummary;
    const hasLifestyleRequirements = requiresSmoking || requiresActivity;

    const hasAllTypes =
      hasMedicalRequirements && hasDemographicRequirements && hasLifestyleRequirements;
    const hasMedicalAndDemographic =
      hasMedicalRequirements && hasDemographicRequirements && !hasLifestyleRequirements;
    const hasMedicalAndLifestyle =
      hasMedicalRequirements && hasLifestyleRequirements && !hasDemographicRequirements;
    const hasDemographicAndLifestyle =
      hasDemographicRequirements && hasLifestyleRequirements && !hasMedicalRequirements;

    // Return appropriate icon based on combination
    if (hasAllTypes) return Award; // Comprehensive study
    if (hasMedicalAndDemographic) return UsersIcon; // Population health study
    if (hasMedicalAndLifestyle) return HeartPulse; // Health-focused lifestyle study
    if (hasDemographicAndLifestyle) return UserCog; // Targeted demographic lifestyle study
    if (hasMedicalRequirements) return Heart; // Medical-focused study
    if (hasDemographicRequirements) return User; // Demographic-focused study
    if (hasLifestyleRequirements) return Activity; // Lifestyle-focused study

    return FlaskConical;
  };

  const StudyIcon = getStudyIcon();

  return (
    <div
      className={`group relative bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-default ${
        !isLast ? "mb-2 sm:mb-3" : ""
      }`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
        <div className="flex-1 pr-0 sm:pr-4 mb-2 sm:mb-0">
          <div className="flex items-center space-x-2 mb-1 sm:mb-0.5">
            <StudyIcon className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
              {study.title}
            </h4>
          </div>
          {study.description && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1">
              {study.description.length > descriptionMaxLength
                ? `${study.description.substring(0, descriptionMaxLength)}...`
                : study.description}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
          {statusBadge}
          {actionButtons && <div className="flex justify-end">{actionButtons}</div>}
        </div>
      </div>

      {/* Stats Row - Responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
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
                year: "numeric",
              })}
            </span>
          </div>

          {/* Contract Address */}
          {study.contractAddress && (
            <div className="flex items-center space-x-1">
              <ExternalLink className="h-3 w-3 text-gray-500" />
              <Link
                href={`https://sepolia.etherscan.io/address/${study.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-mono"
              >
                {study.contractAddress.slice(0, 6)}...{study.contractAddress.slice(-4)}
              </Link>
            </div>
          )}
        </div>

        {/* Template badge - compact */}
        {!hideTemplateBadge && study.templateName && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-center">
            {study.templateName}
          </span>
        )}
      </div>

      {/* Simple progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2 sm:mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isFull ? "bg-red-500" : isAlmostFull ? "bg-orange-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(participantPercentage, 100)}%` }}
        />
      </div>

      {/* Criteria badges - only show if there are any criteria */}
      {hasAnyCriteria && (
        <div className="pt-1.5 sm:pt-2 border-t border-gray-100">
          <StudyCriteriaBadges
            studyCriteriaSummary={study.criteriaSummary}
            showLabel={showCriteriaLabel}
          />
        </div>
      )}
    </div>
  );
}

import { StudySummary } from "@/services/api/studyService";
import StudyCard from "@/app/dashboard/components/shared/StudyCard";
import { getStudyStatusColor } from "@/app/dashboard/components/shared/StudyUtils";

interface StudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  renderActionButtons: (study: StudySummary) => React.ReactNode;
  descriptionMaxLength?: number;
  showCriteriaLabel?: boolean;
  header?: React.ReactNode;
}

/**
 * Generic component for rendering a list of studies with customizable action buttons.
 * This component handles the common layout and styling while allowing specific implementations
 * to customize the action buttons through the renderActionButtons prop.
 */
export default function StudiesList({
  studies,
  renderActionButtons,
  descriptionMaxLength = 80,
  showCriteriaLabel = false,
  header,
}: StudiesListProps) {
  return (
    <div className="p-4">
      {header}
      <div className="space-y-3">
        {studies.map((study, index) => (
          <StudyCard
            key={study.id}
            study={study}
            isLast={index === studies.length - 1}
            statusBadge={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStudyStatusColor(
                  study.status
                )}`}
              >
                {study.status.charAt(0).toUpperCase() + study.status.slice(1)}
              </span>
            }
            actionButtons={renderActionButtons(study)}
            descriptionMaxLength={descriptionMaxLength}
            showCriteriaLabel={showCriteriaLabel}
          />
        ))}
      </div>
    </div>
  );
}

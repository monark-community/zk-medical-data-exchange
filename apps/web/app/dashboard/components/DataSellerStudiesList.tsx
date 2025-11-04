import { StudySummary } from "@/services/api/studyService";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudyCard from "./shared/StudyCard";
import { getStudyStatusColor } from "./shared/StudyUtils";

interface DataSellerStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onApplyToStudy: (id: number) => Promise<void>;
  walletAddress?: string;
}

export default function DataSellerStudiesList({
  studies,
  onApplyToStudy,
  walletAddress,
}: DataSellerStudiesListProps) {
  const canApply = (study: StudySummary) => {
    return study.status === "active" && study.currentParticipants < study.maxParticipants;
  };

  return (
    <div className="p-4">
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
            actionButtons={
              canApply(study) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyToStudy(study.id);
                  }}
                  disabled={!walletAddress}
                  className="h-7 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  title={walletAddress ? "Apply to study" : "Connect wallet to apply"}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-7 px-3 text-gray-400 border-gray-200"
                  title={
                    study.currentParticipants >= study.maxParticipants
                      ? "Study is full"
                      : "Study not accepting applications"
                  }
                >
                  {study.currentParticipants >= study.maxParticipants ? "Full" : "Closed"}
                </Button>
              )
            }
            descriptionMaxLength={100}
            showCriteriaLabel={true}
          />
        ))}
      </div>
    </div>
  );
}

import { StudySummary } from "@/services/api/studyService";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudyCard from "./shared/StudyCard";
import { getStudyStatusColor } from "./shared/StudyUtils";

interface ResearcherStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onDeleteStudy: (id: number) => Promise<void>;
  deletingStudyId: number | null;
}

export default function ResearcherStudiesList({ studies, onDeleteStudy, deletingStudyId }: ResearcherStudiesListProps) {
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
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStudy(study.id);
                }}
                disabled={deletingStudyId === study.id}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                title="Delete study"
              >
                {deletingStudyId === study.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            }
            descriptionMaxLength={80}
            showCriteriaLabel={false}
          />
        ))}
      </div>
    </div>
  );
}

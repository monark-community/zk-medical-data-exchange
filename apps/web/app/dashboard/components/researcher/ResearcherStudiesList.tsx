import { StudySummary } from "@/services/api/studyService";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import { Spinner } from "@/components/ui/spinner";

interface ResearcherStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onDeleteStudy: (id: number) => Promise<void>;
  deletingStudyId: number | null;
}

export default function ResearcherStudiesList({
  studies,
  onDeleteStudy,
  deletingStudyId,
}: ResearcherStudiesListProps) {
  const renderActionButtons = (study: StudySummary) => (
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
        <Spinner className="size-3 text-blue-600" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <StudiesList
      studies={studies}
      renderActionButtons={renderActionButtons}
      descriptionMaxLength={80}
      showCriteriaLabel={false}
    />
  );
}

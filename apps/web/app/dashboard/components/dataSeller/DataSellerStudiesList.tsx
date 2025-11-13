import { StudySummary } from "@/services/api/studyService";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import { Spinner } from "@/components/ui/spinner";

interface DataSellerStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onApplyToStudy: (id: number) => Promise<void>;
  applyingStudyId: number | null;
  walletAddress?: string;
}

export default function DataSellerStudiesList({
  studies,
  onApplyToStudy,
  applyingStudyId,
  walletAddress,
}: DataSellerStudiesListProps) {
  const canApply = (study: StudySummary) => {
    return study.status === "active" && study.currentParticipants < study.maxParticipants;
  };

  const renderActionButtons = (study: StudySummary) => {
    const isApplying = applyingStudyId === study.id;

    if (canApply(study)) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onApplyToStudy(study.id);
          }}
          disabled={!walletAddress || isApplying}
          className="h-7 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          title={walletAddress ? "Apply to study" : "Connect wallet to apply"}
        >
          {isApplying ? (
            <>
              <Spinner className="size-3 text-blue-600" />
              Applying...
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3 mr-1" />
              Apply
            </>
          )}
        </Button>
      );
    }

    return (
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
    );
  };

  return (
    <StudiesList
      studies={studies}
      renderActionButtons={renderActionButtons}
      descriptionMaxLength={100}
      showCriteriaLabel={true}
    />
  );
}

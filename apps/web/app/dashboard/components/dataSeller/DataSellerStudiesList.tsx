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
  isTxProcessing?: boolean;
  eligibilityLoading?: boolean;
}

export default function DataSellerStudiesList({
  studies,
  onApplyToStudy,
  applyingStudyId,
  walletAddress,
  isTxProcessing = false,
  eligibilityLoading = false,
}: DataSellerStudiesListProps) {
  const canApplyToStudy = (study: StudySummary) => {
    const isStudyAcceptingApplications =
      study.status === "active" && study.currentParticipants < study.maxParticipants;

    if (walletAddress && study.canApply !== undefined) {
      return isStudyAcceptingApplications && study.canApply;
    }

    return isStudyAcceptingApplications;
  };

  const getDisabledReason = (study: StudySummary): string => {
    if (!walletAddress) {
      return "Connect wallet to apply";
    }
    if (isTxProcessing) {
      return "Transaction in progress...";
    }
    if (study.currentParticipants >= study.maxParticipants) {
      return "Study is full";
    }
    if (study.status !== "active") {
      return "Study not accepting applications";
    }
    if (study.isEnrolled) {
      return "Already enrolled in this study";
    }
    if (study.canApply === false) {
      return "You previously failed eligibility for this study";
    }
    return "Apply to study";
  };

  const renderActionButtons = (study: StudySummary) => {
    const isApplying = applyingStudyId === study.id;
    const canApply = canApplyToStudy(study);

    if (study.isEnrolled) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-7 px-3 text-blue-600 border-blue-200 bg-blue-50"
          title="Already enrolled in this study"
        >
          Enrolled
        </Button>
      );
    }

    if (walletAddress && study.canApply === false) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-7 px-3 text-red-600 border-red-200"
        >
          Ineligible
        </Button>
      );
    }

    if (walletAddress && eligibilityLoading && study.canApply === undefined) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-7 px-3 text-gray-500 border-gray-200"
        >
          <Spinner className="size-3 text-gray-500 mr-1" />
          Loading...
        </Button>
      );
    }

    if (canApply) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onApplyToStudy(study.id);
          }}
          disabled={!walletAddress || isApplying || isTxProcessing}
          className="h-7 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          title={getDisabledReason(study)}
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
        title={getDisabledReason(study)}
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

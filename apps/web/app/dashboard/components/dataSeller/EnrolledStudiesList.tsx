import { StudySummary } from "@/services/api/studyService";
import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import { Spinner } from "@/components/ui/spinner";

interface EnrolledStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onRevokeConsent: (id: number) => Promise<void>;
  revokingStudyId: number | null;
  walletAddress?: string;
}

export default function EnrolledStudiesList({
  studies,
  onRevokeConsent,
  revokingStudyId,
  walletAddress,
}: EnrolledStudiesListProps) {
  const renderActionButtons = (study: StudySummary) => {
    const isRevoking = revokingStudyId === study.id;

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Are you sure you want to revoke consent and leave this study?")) {
            onRevokeConsent(study.id);
          }
        }}
        disabled={!walletAddress || isRevoking}
        className="h-7 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        title={
          walletAddress ? "Revoke consent and leave study" : "Connect wallet to revoke consent"
        }
      >
        {isRevoking ? (
          <>
            <Spinner className="size-3 text-blue-600" />
            Revoking...
          </>
        ) : (
          <>
            <UserMinus className="h-3 w-3 mr-1" />
            Remove Consent
          </>
        )}
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

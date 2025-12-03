import { StudySummary } from "@/services/api/studyService";
import { UserMinus, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import { Spinner } from "@/components/ui/spinner";
import { modifyStudiesForCompletion } from "@/utils/studyUtils";
import { useState } from "react";
import { CustomConfirmAlert } from "@/components/alert/CustomConfirmAlert";

interface EnrolledStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onRevokeConsent: (id: number) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onGrantConsent: (id: number) => Promise<void>;
  revokingStudyId: number | null;
  grantingStudyId: number | null;
  walletAddress?: string;
  isTxProcessing?: boolean;
}

export default function EnrolledStudiesList({
  studies,
  onRevokeConsent,
  onGrantConsent,
  revokingStudyId,
  grantingStudyId,
  walletAddress,
  isTxProcessing = false,
}: EnrolledStudiesListProps) {
  const [revokeStudyId, setRevokeStudyId] = useState<number | null>(null);
  const [grantStudyId, setGrantStudyId] = useState<number | null>(null);

  const modifiedStudies = modifyStudiesForCompletion(studies);

  const renderActionButtons = (study: StudySummary) => {
    const isRevoking = revokingStudyId === study.id;
    const isGranting = grantingStudyId === study.id;
    const hasConsent = study.hasConsented ?? true;
    const isStudyFull = study.currentParticipants >= study.maxParticipants;
    const endDate =
      study.createdAt && study.durationDays
        ? new Date(new Date(study.createdAt).getTime() + study.durationDays * 24 * 60 * 60 * 1000)
        : null;
    const isCompleted = (endDate ? new Date() > endDate : false) || study.status === "completed";

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Consent Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {hasConsent ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-700 font-medium">Active Consent</span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-red-700 font-medium">Consent Revoked</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Revoke Button - Only show if consent is active and study is not completed */}
          {hasConsent && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRevokeStudyId(study.id);
              }}
              disabled={!walletAddress || isRevoking || isTxProcessing}
              className="h-7 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              title={
                walletAddress
                  ? isTxProcessing
                    ? "Transaction in progress..."
                    : "Revoke consent for this study"
                  : "Connect wallet to revoke consent"
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
                  Revoke Consent
                </>
              )}
            </Button>
          )}

          {/* Grant Button - Only show if consent is revoked and study is not completed */}
          {!hasConsent && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (isStudyFull) {
                  return;
                }
                setGrantStudyId(study.id);
              }}
              disabled={!walletAddress || isGranting || isStudyFull || isTxProcessing}
              className={`h-7 px-3 ${
                isStudyFull
                  ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              }`}
              title={
                isStudyFull
                  ? "Study is full - cannot grant consent"
                  : isTxProcessing
                  ? "Transaction in progress..."
                  : walletAddress
                  ? "Grant consent for this study"
                  : "Connect wallet to grant consent"
              }
            >
              {isGranting ? (
                <>
                  <Spinner className="size-3 text-blue-600" />
                  Granting...
                </>
              ) : isStudyFull ? (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Study Full
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Grant Consent
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <StudiesList
        studies={modifiedStudies}
        renderActionButtons={renderActionButtons}
        descriptionMaxLength={100}
        showCriteriaLabel={true}
        hideTemplateBadge={true}
      />
      <CustomConfirmAlert
        open={revokeStudyId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeStudyId(null);
        }}
        description="Are you sure you want to revoke consent? This will prevent researchers from accessing your data for this study."
        alertTitle="Revoke Consent"
        onConfirm={() => {
          if (revokeStudyId) {
            onRevokeConsent(revokeStudyId);
            setRevokeStudyId(null);
          }
        }}
        onCancel={() => setRevokeStudyId(null)}
      />
      <CustomConfirmAlert
        open={grantStudyId !== null}
        onOpenChange={(open) => {
          if (!open) setGrantStudyId(null);
        }}
        description="Grant consent to allow researchers to access your data for this study again?"
        alertTitle="Grant Consent"
        onConfirm={() => {
          if (grantStudyId) {
            onGrantConsent(grantStudyId);
            setGrantStudyId(null);
          }
        }}
        onCancel={() => setGrantStudyId(null)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { StudySummary } from "@/services/api/studyService";
import { Trash2, StopCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import EndStudyDialog from "./EndStudyDialog";
import StudyCompletionSummary from "./StudyCompletionSummary";
import { Spinner } from "@/components/ui/spinner";
import { modifyStudiesForCompletion } from "@/utils/studyUtils";
import { useTxStatusState } from "@/hooks/useTxStatus";

interface ResearcherStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onDeleteStudy: (id: number) => Promise<void>;
  deletingStudyId: number | null;
  onStudyEnded?: () => void;
}

export type StudyData = {
  studyId: number;
  participantsCount: number;
  dataPointsCollected: number;
  transactionHash: string;
  durationDays: number;
};

export default function ResearcherStudiesList({
  studies,
  onDeleteStudy,
  deletingStudyId,
  onStudyEnded,
}: ResearcherStudiesListProps) {
  const originalStudies = studies;
  const modifiedStudies = modifyStudiesForCompletion(studies);

  const [endStudyDialogOpen, setEndStudyDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudySummary | null>(null);
  const [summaryStudy, setSummaryStudy] = useState<{
    id: number;
    title: string;
    transactionHash: string;
    currentParticipants: number;
    durationDays: number | undefined;
  } | null>(null);

  const handleEndStudyClick = (study: StudySummary) => {
    setSelectedStudy(study);
    setEndStudyDialogOpen(true);
  };

  const handleStudyEnded = () => {
    onStudyEnded?.();
  };

  const handleShowResults = (study: StudySummary) => {
    setSummaryStudy({
      id: study.id,
      title: study.title,
      transactionHash: study.transactionHash || "",
      currentParticipants: study.currentParticipants,
      durationDays: study.durationDays,
    });
    setSummaryDialogOpen(true);
  };

  const renderActionButtons = (study: StudySummary) => {
    const originalStudy = originalStudies.find((s) => s.id === study.id);
    if (!originalStudy) return null;
    const { isVisible: isTxProcessing } = useTxStatusState();
    const endDate =
      study.createdAt && study.durationDays
        ? new Date(new Date(study.createdAt).getTime() + study.durationDays * 24 * 60 * 60 * 1000)
        : null;
    const isExpired = endDate ? new Date() > endDate : false;

    return (
      <div className="flex items-center space-x-2">
        {originalStudy.status === "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleShowResults(study);
            }}
            className="h-7 px-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 bg-emerald-50/50 text-xs font-semibold shadow-sm"
            title="View study results"
            disabled={isTxProcessing}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Show Results
          </Button>
        )}

        {isExpired && originalStudy.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEndStudyClick(study);
            }}
            className="h-7 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 text-xs font-medium"
            title="Complete expired study to get results"
            disabled={isTxProcessing}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Get Data
          </Button>
        )}

        {!isExpired && originalStudy.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEndStudyClick(study);
            }}
            className="h-7 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 text-xs font-medium"
            title="End study"
            disabled={isTxProcessing}
          >
            <StopCircle className="h-3 w-3 mr-1" />
            End Study
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteStudy(study.id);
          }}
          disabled={deletingStudyId === study.id || isTxProcessing}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          title="Delete study"
        >
          {deletingStudyId === study.id ? (
            <Spinner className="size-3 text-blue-600" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <>
      <StudiesList
        studies={modifiedStudies}
        renderActionButtons={renderActionButtons}
        descriptionMaxLength={80}
        showCriteriaLabel={false}
      />

      {selectedStudy && (
        <EndStudyDialog
          open={endStudyDialogOpen}
          onOpenChange={setEndStudyDialogOpen}
          studyTitle={selectedStudy.title}
          studyId={selectedStudy.id}
          onStudyEnded={handleStudyEnded}
        />
      )}

      {summaryStudy && (
        <StudyCompletionSummary
          open={summaryDialogOpen}
          onOpenChange={setSummaryDialogOpen}
          studyTitle={summaryStudy.title}
          studyId={summaryStudy.id}
          transactionHash={summaryStudy.transactionHash}
          currentParticipants={summaryStudy.currentParticipants}
          durationDays={summaryStudy.durationDays}
        />
      )}
    </>
  );
}

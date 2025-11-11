"use client";

import { useState } from "react";
import { StudySummary } from "@/services/api/studyService";
import { Trash2, Loader2, StopCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudiesList from "@/app/dashboard/components/shared/StudiesList";
import EndStudyDialog from "./EndStudyDialog";
import StudyCompletionSummary from "./StudyCompletionSummary";

interface ResearcherStudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onDeleteStudy: (id: number) => Promise<void>;
  deletingStudyId: number | null;
  onStudyEnded?: () => void;
}

export default function ResearcherStudiesList({ 
  studies, 
  onDeleteStudy, 
  deletingStudyId,
  onStudyEnded
}: ResearcherStudiesListProps) {
  const [endStudyDialogOpen, setEndStudyDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudySummary | null>(null);
  const [summaryStudy, setSummaryStudy] = useState<{ id: number; title: string } | null>(null);

  const handleEndStudyClick = (study: StudySummary) => {
    setSelectedStudy(study);
    setEndStudyDialogOpen(true);
  };

  const handleStudyEnded = () => {
    onStudyEnded?.();
  };

  const handleShowResults = (study: StudySummary) => {
    setSummaryStudy({ id: study.id, title: study.title });
    setSummaryDialogOpen(true);
  };

  const renderActionButtons = (study: StudySummary) => (
    <div className="flex items-center space-x-2">
      {study.status === "completed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleShowResults(study);
          }}
          className="h-7 px-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 bg-emerald-50/50 text-xs font-semibold shadow-sm"
          title="View study results"
        >
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          Show Results
        </Button>
      )}
      
      {study.status !== "completed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEndStudyClick(study);
          }}
          className="h-7 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 text-xs font-medium"
          title="End study"
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
    </div>
  );

  return (
    <>
      <StudiesList
        studies={studies}
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
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useAccount } from "wagmi";
import StudyCreationDialog from "@/components/StudyCreationDialog";
import { useStudies } from "@/hooks/useStudies";
import { deleteStudy } from "@/services/api/studyService";
import ResearcherStudiesList from "@/app/dashboard/components/researcher/ResearcherStudiesList";
import DashboardSectionHeader from "@/app/dashboard/components/shared/DashboardSectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";
import eventBus from "@/lib/eventBus";
import { CustomConfirmAlert } from "@/components/alert/CustomConfirmAlert";
import { useTxStatusState } from "@/hooks/useTxStatus";

export default function ResearcherStudiesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState<number | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{
    open: boolean;
    studyId: number;
    description: React.ReactNode;
  } | null>(null);
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(walletAddress);

  const handleStudyCreated = () => {
    console.log("Study created successfully!");
    refetch();
  };

  const performDeleteStudy = async (studyId: number) => {
    const study = studies.find((s) => s.id === studyId);
    console.log(`Attempting to delete study ${studyId}: "${study?.title}"`);
    console.log("Current studies count:", studies.length);
    setDeletingStudyId(studyId);
    try {
      await deleteStudy(studyId, walletAddress!);
      console.log("Study deleted successfully from API!");
      refetch();
      eventBus.emit("studyDeleted");
    } catch (error: any) {
      console.error("Error deleting study:", error);

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || "Bad request";
        useTxStatusState.getState().showError(`Failed to delete study: ${errorMessage}`);
      } else if (error.response?.status === 404) {
        useTxStatusState.getState().showError("Study not found. It may have already been deleted.");
        refetch();
      } else if (error.response?.status === 403) {
        useTxStatusState.getState().showError("You don't have permission to delete this study.");
      } else {
        useTxStatusState
          .getState()
          .showError(`Failed to delete study: ${error.message || "Unknown error"}`);
      }
    } finally {
      setDeletingStudyId(null);
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!walletAddress) {
      useTxStatusState.getState().showError("Wallet not connected");
      return;
    }

    const study = studies.find((s) => s.id === studyId);

    let confirmDescription: React.ReactNode;

    if (study?.status === "active") {
      confirmDescription = (
        <div className="space-y-3">
          <p className="text-red-600 font-bold text-lg">
            WARNING: You are about to delete an ACTIVE study!
          </p>
          <div className="space-y-1">
            <p>
              <strong>Study:</strong> "{study?.title}"
            </p>
            <p>
              <strong>Status:</strong> {study.status}
            </p>
            <p>
              <strong>Participants:</strong> {study.currentParticipants}/{study.maxParticipants}
            </p>
          </div>
          <p>
            <strong>This will:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Permanently delete the study and all its data</li>
            <li>Stop all ongoing data collection</li>
            <li>Remove access for all participants</li>
            <li>Cannot be undone</li>
          </ul>
          <p className="font-semibold">Are you absolutely sure you want to proceed?</p>
        </div>
      );
    } else {
      confirmDescription = (
        <div className="space-y-3">
          <p>
            Are you sure you want to delete <strong>"{study?.title}"</strong>?
          </p>
          <p>
            This action cannot be undone and will permanently remove the study and all its data.
          </p>
        </div>
      );
    }

    setDeleteAlert({ open: true, studyId, description: confirmDescription });
  };

  return (
    <div className="w-full space-y-8">
      <DashboardSectionHeader
        icon={<BookOpen className="h-8 w-8 text-white" />}
        title="Your Medical Studies"
        description="Create and manage your research studies with zero-knowledge privacy"
        action={
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Study
          </Button>
        }
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <StudiesContainer
          isLoading={isLoading}
          error={error}
          studies={studies}
          onRetry={refetch}
          emptyState={{
            title: "No studies yet",
            description:
              "Get started by creating your first medical research study with zero-knowledge privacy.",
            action: (
              <div className="relative group inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Study
                </Button>
              </div>
            ),
          }}
        >
          <ResearcherStudiesList
            studies={studies}
            onDeleteStudy={handleDeleteStudy}
            deletingStudyId={deletingStudyId}
            onStudyEnded={refetch}
          />
        </StudiesContainer>
      </div>

      {/* Study Creation Dialog */}
      <StudyCreationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onStudyCreated={handleStudyCreated}
      />

      <CustomConfirmAlert
        open={deleteAlert?.open || false}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteAlert(null);
        }}
        alertTitle="Confirm Study Deletion"
        description={deleteAlert?.description || ""}
        onConfirm={async () => {
          if (deleteAlert?.studyId) {
            await performDeleteStudy(deleteAlert.studyId);
          }
          setDeleteAlert(null);
        }}
        onCancel={() => setDeleteAlert(null)}
      />
    </div>
  );
}

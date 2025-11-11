"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useAccount } from "wagmi";
import StudyCreationDialog from "@/components/StudyCreationDialog";
import { useStudies } from "@/hooks/useStudies";
import { deleteStudy } from "@/services/api/studyService";
import ResearcherStudiesList from "@/app/dashboard/components/researcher/ResearcherStudiesList";
import StudySectionHeader from "@/app/dashboard/components/shared/StudySectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";

export default function ResearcherStudiesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState<number | null>(null);
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(walletAddress);

  const handleStudyCreated = () => {
    console.log("Study created successfully!");
    refetch();
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    const study = studies.find((s) => s.id === studyId);

    let confirmMessage = `Are you sure you want to delete "${study?.title}"?\n\nThis action cannot be undone and will permanently remove the study and all its data.`;

    if (study?.status === "active") {
      confirmMessage = `⚠️ WARNING: You are about to delete an ACTIVE study!\n\nStudy: "${study?.title}"\nStatus: ${study.status}\nParticipants: ${study.currentParticipants}/${study.maxParticipants}\n\nThis will:\n• Permanently delete the study and all its data\n• Stop all ongoing data collection\n• Remove access for all participants\n• Cannot be undone\n\nAre you absolutely sure you want to proceed?`;
    }

    if (window.confirm(confirmMessage)) {
      console.log(`Attempting to delete study ${studyId}: "${study?.title}"`);
      console.log("Current studies count:", studies.length);
      setDeletingStudyId(studyId);
      try {
        await deleteStudy(studyId, walletAddress);
        console.log("Study deleted successfully from API!");
        refetch();
      } catch (error: any) {
        console.error("Error deleting study:", error);

        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.error || "Bad request";
          alert(`Failed to delete study: ${errorMessage}`);
        } else if (error.response?.status === 404) {
          alert("Study not found. It may have already been deleted.");
          refetch();
        } else if (error.response?.status === 403) {
          alert("You don't have permission to delete this study.");
        } else {
          alert(`Failed to delete study: ${error.message || "Unknown error"}`);
        }
      } finally {
        setDeletingStudyId(null);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <StudySectionHeader
          title="Your Medical Studies"
          icon={<BookOpen className="h-8 w-8" />}
          action={
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                size="lg"
                className="relative w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Plus className="mr-3 h-5 w-5" />
                Create New Study
              </Button>
            </div>
          }
        />

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
    </div>
  );
}

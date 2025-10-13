"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Activity, Loader2, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";
import StudyCreationDialog from "@/components/StudyCreationDialog";
import { useStudies } from "@/hooks/useStudies";
import { deleteStudy } from "@/services/api/studyService";
import StudiesList from "./StudiesList";

export default function StudiesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState<number | null>(null);
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(walletAddress);

  const handleStudyCreated = () => {
    console.log("Study created successfully!");
    refetch(); // Refresh the studies list
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

  const totalStudies = studies.length;
  const activeStudies = studies.filter((study) => study.status === "active").length;
  const totalParticipants = studies.reduce((sum, study) => sum + study.currentParticipants, 0);

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* Header Section */}
        <div className="header space-y-1.5 p-6 flex flex-row items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <span>Your Medical Studies</span>
          </h3>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Study
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total Studies</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalStudies}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Active Participants</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalParticipants}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Active Studies</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : activeStudies}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Studies Container - Scrollable */}
        <div className="px-6 pb-6">
          <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50/50">
            {error ? (
              <div className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Error loading studies</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <Button
                  onClick={refetch}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading studies...</h3>
                <p className="text-gray-600">Fetching your medical research studies</p>
              </div>
            ) : studies.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No studies yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first medical research study with zero-knowledge
                  privacy.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Study
                </Button>
              </div>
            ) : (
              <StudiesList
                studies={studies}
                onDeleteStudy={handleDeleteStudy}
                deletingStudyId={deletingStudyId}
              />
            )}
          </div>
        </div>
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

"use client";

import { BookOpen, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useStudies } from "@/hooks/useStudies";
import DataSellerStudiesList from "@/app/dashboard/components/dataSeller/DataSellerStudiesList";
import EnrolledStudiesList from "@/app/dashboard/components/dataSeller/EnrolledStudiesList";
import StudySectionHeader from "@/app/dashboard/components/shared/StudySectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";
import DashboardSectionHeader from "@/app/dashboard/components/shared/DashboardSectionHeader";
import { useState, useEffect } from "react";
import { getAggregatedMedicalData } from "@/services/core/medicalDataAggregator";
import { convertToZkReady } from "@/services/fhir";
import {
  StudyApplicationService,
  getEnrolledStudies,
  revokeStudyConsent,
  grantStudyConsent,
} from "@/services/api/studyService";
import eventBus from "@/lib/eventBus";
import { useTxStatusState } from "@/hooks/useTxStatus";

type ViewMode = "enrolled" | "available";

export default function DataSellerStudiesSection() {
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(undefined, true);
  const [applyingStudyId, setApplyingStudyId] = useState<number | null>(null);
  const [revokingStudyId, setRevokingStudyId] = useState<number | null>(null);
  const [grantingStudyId, setGrantingStudyId] = useState<number | null>(null);
  const [enrolledStudies, setEnrolledStudies] = useState<any[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("available");
  const { show, showError, hide, isVisible: isTxProcessing } = useTxStatusState();

  useEffect(() => {
    if (walletAddress) {
      setEnrolledLoading(true);
      getEnrolledStudies(walletAddress)
        .then((data) => setEnrolledStudies(data))
        .catch((error) => console.error("Failed to fetch enrolled studies:", error))
        .finally(() => setEnrolledLoading(false));
    } else {
      setEnrolledStudies([]);
    }
  }, [walletAddress]);

  const handleApplyToStudy = async (studyId: number) => {
    if (!walletAddress) {
      showError("Wallet not connected");
      return;
    }

    if (applyingStudyId === studyId) {
      return;
    }

    setApplyingStudyId(studyId);

    try {
      show("Starting study application process...");
      console.log("Starting secure study application process...");

      show("Retrieving your medical data...");
      const data = await getAggregatedMedicalData(walletAddress);

      console.log("Aggregated medical data retrieved for study application:", data);

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No medical data available for study application.");
      }

      show("Preparing data for eligibility check...");
      const zkReadyMedicalData = convertToZkReady(data);
      if (!zkReadyMedicalData) {
        throw new Error("No valid medical data available for study application.");
      }

      show("Verifying eligibility and generating proof...");
      const result = await StudyApplicationService.applyToStudy(
        studyId,
        zkReadyMedicalData,
        walletAddress
      );

      if (result.success) {
        show("✓ " + result.message);
        setTimeout(() => {
          hide();
        }, 3000);

        refetch();
        if (walletAddress) {
          getEnrolledStudies(walletAddress)
            .then((data) => setEnrolledStudies(data))
            .catch((error) => console.error("Failed to fetch enrolled studies:", error));
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error during study application:", error);
      showError(`Application failed: ${error.message || error}`);
      setTimeout(() => {
        hide();
      }, 5000);
    } finally {
      setApplyingStudyId(null);
    }
  };

  const handleRevokeConsent = async (studyId: number) => {
    if (!walletAddress) {
      showError("Wallet not connected");
      return;
    }

    if (revokingStudyId === studyId) {
      return;
    }

    setRevokingStudyId(studyId);

    try {
      show("Revoking consent...");
      console.log("Revoking consent for study:", studyId);

      const result = await revokeStudyConsent(studyId, walletAddress);

      if (result.success) {
        console.log("Consent revoked successfully!");
        if (result.blockchainTxHash) {
          console.log("Blockchain transaction:", result.blockchainTxHash);
        }
        eventBus.emit("consentChanged");
        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        show("✓ Consent revoked successfully!");
        setTimeout(() => {
          hide();
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to revoke consent:", error);
      showError(
        `Failed to revoke consent: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setTimeout(() => {
        hide();
      }, 5000);
    } finally {
      setRevokingStudyId(null);
    }
  };

  const handleGrantConsent = async (studyId: number) => {
    if (!walletAddress) {
      showError("Wallet not connected");
      return;
    }

    if (grantingStudyId === studyId) {
      return;
    }

    setGrantingStudyId(studyId);

    try {
      show("Granting consent...");
      console.log("Granting consent for study:", studyId);

      const result = await grantStudyConsent(studyId, walletAddress);

      if (result.success) {
        console.log("Consent granted successfully!");
        if (result.blockchainTxHash) {
          console.log("Blockchain transaction:", result.blockchainTxHash);
        }
        eventBus.emit("consentChanged");
        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        show("✓ Consent granted successfully!");
        setTimeout(() => {
          hide();
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to grant consent:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("full") || errorMessage.includes("Full")) {
        showError(
          "Cannot grant consent: This study is now full. The maximum number of active participants has been reached."
        );
      } else {
        showError(`Failed to grant consent: ${errorMessage}`);
      }
      setTimeout(() => {
        hide();
      }, 5000);
    } finally {
      setGrantingStudyId(null);
    }
  };

  const enrolledStudyIds = new Set(enrolledStudies.map((s) => s.id));
  const availableStudies = studies.filter((study) => !enrolledStudyIds.has(study.id));

  return (
    <div className="w-full space-y-8">
      <DashboardSectionHeader
        icon={<BookOpen className="h-8 w-8 text-white" />}
        title="Research Studies"
        description={
          viewMode === "available"
            ? "Discover and apply to participate in medical research"
            : "Manage your active study participations"
        }
      >
        {/* Sleek Tab Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("available")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              viewMode === "available"
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white/60 text-gray-700 hover:bg-white hover:shadow-md"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Browse Studies</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                viewMode === "available" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {availableStudies.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode("enrolled")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              viewMode === "enrolled"
                ? "bg-emerald-600 text-white shadow-lg scale-105"
                : "bg-white/60 text-gray-700 hover:bg-white hover:shadow-md"
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>My Enrolled Studies</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                viewMode === "enrolled" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {enrolledStudies.length}
            </span>
          </button>
        </div>
      </DashboardSectionHeader>

      {/* Available Studies View */}
      {viewMode === "available" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <StudySectionHeader
            title="Available Medical Studies"
            icon={<BookOpen className="h-8 w-8 text-blue-600" />}
            action={
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">Showing</span>
                <span className="text-sm font-semibold text-blue-600">
                  {availableStudies.length} {availableStudies.length === 1 ? "study" : "studies"}
                </span>
              </div>
            }
          />

          <StudiesContainer
            isLoading={isLoading}
            error={error}
            studies={availableStudies}
            onRetry={refetch}
            emptyState={{
              title: "No studies available",
              description:
                "There are currently no medical research studies available. Check back later!",
            }}
          >
            <DataSellerStudiesList
              studies={availableStudies}
              onApplyToStudy={handleApplyToStudy}
              applyingStudyId={applyingStudyId}
              walletAddress={walletAddress}
              isTxProcessing={isTxProcessing}
            />
          </StudiesContainer>
        </div>
      )}

      {/* Enrolled Studies View */}
      {viewMode === "enrolled" && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <StudySectionHeader
            title="My Enrolled Studies"
            icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            action={
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">Active</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {enrolledStudies.length} {enrolledStudies.length === 1 ? "study" : "studies"}
                </span>
              </div>
            }
          />

          <StudiesContainer
            isLoading={isLoading || enrolledLoading}
            error={error}
            studies={enrolledStudies}
            onRetry={refetch}
            emptyState={{
              title: "No enrolled studies",
              description:
                "You haven't joined any studies yet. Browse available studies to get started!",
            }}
          >
            <EnrolledStudiesList
              studies={enrolledStudies}
              onRevokeConsent={handleRevokeConsent}
              onGrantConsent={handleGrantConsent}
              revokingStudyId={revokingStudyId}
              grantingStudyId={grantingStudyId}
              walletAddress={walletAddress}
              isTxProcessing={isTxProcessing}
            />
          </StudiesContainer>
        </div>
      )}
    </div>
  );
}

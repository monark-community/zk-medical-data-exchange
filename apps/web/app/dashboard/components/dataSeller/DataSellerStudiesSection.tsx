"use client";

import { BookOpen } from "lucide-react";
import { useAccount } from "wagmi";
import { useStudies } from "@/hooks/useStudies";
import DataSellerStudiesList from "@/app/dashboard/components/dataSeller/DataSellerStudiesList";
import StudySectionHeader from "@/app/dashboard/components/shared/StudySectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";
import { useState } from "react";
import { getAggregatedMedicalData } from "@/services/core/medicalDataAggregator";
import { convertToZkReady } from "@/services/fhir";
import { StudyApplicationService } from "@/services/api";

export default function DataSellerStudiesSection() {
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(undefined, true);
   const [applyingStudyId, setApplyingStudyId] = useState<number | null>(null);

  const handleApplyToStudy = async (studyId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    if (applyingStudyId === studyId) {
      return;
    }

    setApplyingStudyId(studyId);

    try{
      console.log("Starting secure study application process...");

      const data = await getAggregatedMedicalData(walletAddress);

      console.log("Aggregated medical data retrieved for study application:", data);

      if (!data || Object.keys(data).length === 0) {
        //TODO better UX
        throw new Error("No medical data available for study application.");
      }

      const zkReadyMedicalData = convertToZkReady(data);
      if (!zkReadyMedicalData) {
        //TODO better UX
        throw new Error("No valid medical data available for study application.");
      }

      const result = await StudyApplicationService.applyToStudy(
        studyId,
        zkReadyMedicalData,
        walletAddress
      );

      if (result.success) {
        alert(`✅ ${result.message}`);
        refetch();
      } else {
        throw new Error(result.message);
      } 


    }
    catch (error: any) {
      console.error("Error during study application:", error);
      alert(`❌ Application failed: ${error.message || error}`);
    } finally {
      setApplyingStudyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <StudySectionHeader
          title="Available Medical Studies"
          icon={<BookOpen className="h-8 w-8" />}
          action={
            <div className="text-sm text-gray-600">Browse studies and apply to participate</div>
          }
        />

        <StudiesContainer
          isLoading={isLoading}
          error={error}
          studies={studies}
          onRetry={refetch}
          emptyState={{
            title: "No studies available",
            description:
              "There are currently no medical research studies available. Check back later!",
          }}
        >
          <DataSellerStudiesList
            studies={studies}
            onApplyToStudy={handleApplyToStudy}
            applyingStudyId={applyingStudyId}
            walletAddress={walletAddress}
          />
        </StudiesContainer>
      </div>
    </div>
  );
}

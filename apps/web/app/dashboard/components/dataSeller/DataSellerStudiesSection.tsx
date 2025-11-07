"use client";

import { BookOpen } from "lucide-react";
import { useAccount } from "wagmi";
import { useStudies } from "@/hooks/useStudies";
import DataSellerStudiesList from "@/app/dashboard/components/dataSeller/DataSellerStudiesList";
import StudySectionHeader from "@/app/dashboard/components/shared/StudySectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";

export default function DataSellerStudiesSection() {
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(undefined, true);

  const handleApplyToStudy = async (studyId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    const study = studies.find((s) => s.id === studyId);

    const confirmMessage = `Do you want to apply to "${study?.title}"?\n\nBy applying, you agree to share your medical data according to the study's privacy requirements.`;

    if (window.confirm(confirmMessage)) {
      console.log(`Applying to study ${studyId}: "${study?.title}"`);
      // TODO: Implement the actual apply logic here
      alert("Application functionality coming soon!");
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
            walletAddress={walletAddress}
          />
        </StudiesContainer>
      </div>
    </div>
  );
}

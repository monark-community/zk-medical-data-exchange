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
  StudySummary,
} from "@/services/api/studyService";
import { submitZKProofToStudy } from "@/services/api/zkAggregationService";
import { zkAggregationService, MedicalDataForAggregation } from "@/services/zk/zkAggregationService";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

type ViewMode = "enrolled" | "available";

/**
 * Convert ExtractedMedicalData to MedicalDataForAggregation format
 * This ensures all required fields are present with default values
 */
function convertToAggregationFormat(
  data: ExtractedMedicalData,
  salt: string
): MedicalDataForAggregation {
  // Use first region if multiple regions are present, default to 0
  const region = data.regions && data.regions.length > 0 ? data.regions[0] : 0;

  return {
    age: data.age || 0,
    gender: data.gender || 0,
    region,
    cholesterol: data.cholesterol || 0,
    bmi: data.bmi || 0,
    systolicBP: data.systolicBP || 0,
    diastolicBP: data.diastolicBP || 0,
    bloodType: data.bloodType || 0,
    hba1c: data.hba1c || 0,
    smokingStatus: data.smokingStatus || 0,
    activityLevel: data.activityLevel || 0,
    diabetesStatus: data.diabetesStatus || 0,
    heartDiseaseHistory: data.heartDiseaseStatus || 0,
    salt,
  };
}

export default function DataSellerStudiesSection() {
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(undefined, true);
  const [applyingStudyId, setApplyingStudyId] = useState<number | null>(null);
  const [revokingStudyId, setRevokingStudyId] = useState<number | null>(null);
  const [grantingStudyId, setGrantingStudyId] = useState<number | null>(null);
  const [enrolledStudies, setEnrolledStudies] = useState<any[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("available");

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

  const handleApplyToStudy = async (study: StudySummary) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    if (applyingStudyId === study.id) {
      return;
    }

    setApplyingStudyId(study.id);

    const startTime = Date.now();
    console.log("🚀 [APPLY] ============================================");
    console.log("🚀 [APPLY] Starting study application process");
    console.log("🚀 [APPLY] Study ID:", study.id);
    console.log("🚀 [APPLY] Study Contract:", study.contractAddress || "Not deployed");
    console.log("🚀 [APPLY] Wallet Address:", walletAddress);
    console.log("🚀 [APPLY] Timestamp:", new Date().toISOString());
    console.log("🚀 [APPLY] ============================================");

    try {
      console.log("📊 [APPLY] Step 1: Fetching aggregated medical data from vault");

      // 1. Get aggregated medical data from vault
      const data = await getAggregatedMedicalData(walletAddress);

      console.log("✅ [APPLY] Medical data retrieved:", {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
      });

      if (!data || Object.keys(data).length === 0) {
        console.error("❌ [APPLY] No medical data available");
        throw new Error("No medical data available for study application.");
      }

      console.log("📝 [APPLY] Step 2: Converting to ZK-ready format");
      const zkReadyMedicalData = convertToZkReady(data);
      if (!zkReadyMedicalData) {
        console.error("❌ [APPLY] Failed to convert medical data to ZK format");
        throw new Error("No valid medical data available for study application.");
      }
      console.log("✅ [APPLY] ZK-ready data prepared:", zkReadyMedicalData);

      // 2. Apply to study (checks eligibility, enrolls participant)
      console.log("📝 [APPLY] Step 3: Submitting study application (enrollment + eligibility)...");
      const result = await StudyApplicationService.applyToStudy(
        study.id,
        zkReadyMedicalData,
        walletAddress
      );

      if (!result.success) {
        console.error("❌ [APPLY] Application failed:", result.message);
        throw new Error(result.message);
      }

      console.log("✅ [APPLY] Successfully enrolled in study!");
      console.log("✅ [APPLY] Application result:", result);
      console.log("✅ [APPLY] Salt:", result.salt);
      console.log("✅ [APPLY] Data Commitment:", result.dataCommitment);

      // 3. Generate and submit ZK proof for privacy-preserving data aggregation
      console.log("🔐 [APPLY] Step 4: Generating ZK proof for data aggregation (NO encryption!)");
      
      if (!result.salt || !result.dataCommitment) {
        throw new Error("Missing salt or data commitment from enrollment. Cannot generate proof.");
      }

      try {
        // Convert medical data to aggregation format
        console.log("� [APPLY] Converting medical data to aggregation format...");
        const aggregationData = convertToAggregationFormat(zkReadyMedicalData, result.salt);
        console.log("✅ [APPLY] Aggregation data prepared:", {
          hasAge: !!aggregationData.age,
          hasGender: !!aggregationData.gender,
          hasCholesterol: !!aggregationData.cholesterol,
          salt: result.salt.substring(0, 10) + "...", // Log partial salt for debugging
        });

        // Validate contract address
        if (!study.contractAddress) {
          throw new Error("Study contract not deployed yet. Please wait for deployment to complete.");
        }

        // Generate ZK proof for aggregation
        console.log("⚙️ [APPLY] Generating ZK proof (this may take a few seconds)...");
        const proofStart = Date.now();
        const proofResult = await zkAggregationService.generateAggregationProof(
          aggregationData,
          study.id.toString(),
          result.dataCommitment,
          study.contractAddress
        );
        const proofDuration = Date.now() - proofStart;
        console.log("✅ [APPLY] ZK proof generated successfully!", {
          durationMs: proofDuration,
          hasProof: !!proofResult.proof,
          hasPublicSignals: !!proofResult.publicSignals,
          dataCommitmentMatches: proofResult.publicSignals.dataCommitment === result.dataCommitment,
        });

        // Verify data commitment matches
        if (proofResult.publicSignals.dataCommitment !== result.dataCommitment) {
          throw new Error(
            "Data commitment mismatch! Generated proof doesn't match enrollment commitment."
          );
        }

        // Submit ZK proof to backend
        console.log("📤 [APPLY] Submitting ZK proof to backend...");
        const submitStart = Date.now();
        const submitResult = await submitZKProofToStudy(study.id, {
          participantAddress: walletAddress,
          proof: proofResult.proof,
          publicSignals: proofResult.publicSignals,
        });
        const submitDuration = Date.now() - submitStart;
        console.log("✅ [APPLY] ZK proof submitted successfully!", {
          durationMs: submitDuration,
          privacyGuarantee: submitResult.privacyGuarantee,
        });

        const totalDuration = Date.now() - startTime;
        console.log("🎉 [APPLY] ============================================");
        console.log("🎉 [APPLY] COMPLETE! Total duration:", totalDuration, "ms");
        console.log("🎉 [APPLY] Privacy Guarantee:", submitResult.privacyGuarantee);
        console.log("🎉 [APPLY] ============================================");

        alert(
          `${result.message}\n\n` +
          `✅ ZK Proof Generated & Submitted!\n\n` +
          `Privacy Guarantee: ${submitResult.privacyGuarantee}\n\n` +
          `Your raw medical data was NEVER sent to the server. ` +
          `Only binned/categorized values are stored for aggregation.`
        );
      } catch (proofError: any) {
        console.error("❌ [APPLY] ============================================");
        console.error("❌ [APPLY] ZK Proof generation/submission failed!");
        console.error("❌ [APPLY] Error:", proofError);
        console.error("❌ [APPLY] Error message:", proofError.message);
        console.error("❌ [APPLY] Error stack:", proofError.stack);
        console.error("❌ [APPLY] ============================================");
        // Note: Don't throw here - enrollment was successful, proof can be retried
        alert(
          `Enrolled successfully, but ZK proof submission failed: ${proofError.message}\n\n` +
          `You can retry submitting your data later. Please contact support if this persists.`
        );
      }
      refetch();
      if (walletAddress) {
        getEnrolledStudies(walletAddress)
          .then((data) => setEnrolledStudies(data))
          .catch((error) => console.error("Failed to fetch enrolled studies:", error));
      }
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error("❌ [APPLY] ============================================");
      console.error("❌ [APPLY] Application failed!");
      console.error("❌ [APPLY] Error:", error);
      console.error("❌ [APPLY] Error message:", error.message);
      console.error("❌ [APPLY] Error stack:", error.stack);
      console.error("❌ [APPLY] Duration before failure:", totalDuration, "ms");
      console.error("❌ [APPLY] ============================================");
      alert(`Application failed: ${error.message || error}`);
    } finally {
      setApplyingStudyId(null);
    }
  };

  const handleRevokeConsent = async (studyId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    if (revokingStudyId === studyId) {
      return;
    }

    setRevokingStudyId(studyId);

    try {
      console.log("Revoking consent for study:", studyId);

      const result = await revokeStudyConsent(studyId, walletAddress);

      if (result.success) {
        console.log("Consent revoked successfully!");
        if (result.blockchainTxHash) {
          console.log("Blockchain transaction:", result.blockchainTxHash);
        }

        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        alert("Consent revoked successfully!");
      }
    } catch (error) {
      console.error("Failed to revoke consent:", error);
      alert(
        `Failed to revoke consent: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setRevokingStudyId(null);
    }
  };

  const handleGrantConsent = async (studyId: number) => {
    if (!walletAddress) {
      alert("Wallet not connected");
      return;
    }

    if (grantingStudyId === studyId) {
      return;
    }

    setGrantingStudyId(studyId);

    try {
      console.log("Granting consent for study:", studyId);

      const result = await grantStudyConsent(studyId, walletAddress);

      if (result.success) {
        console.log("Consent granted successfully!");
        if (result.blockchainTxHash) {
          console.log("Blockchain transaction:", result.blockchainTxHash);
        }

        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        alert("Consent granted successfully!");
      }
    } catch (error) {
      console.error("Failed to grant consent:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("full") || errorMessage.includes("Full")) {
        alert(
          "Cannot grant consent: This study is now full. The maximum number of active participants has been reached."
        );
      } else {
        alert(`Failed to grant consent: ${errorMessage}`);
      }
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
            />
          </StudiesContainer>
        </div>
      )}
    </div>
  );
}

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
import { 
  uploadStudyData, 
  getStudyPublicKey 
} from "@/services/api/studyDataService";
import { encryptMedicalDataForUpload } from "@/utils/encryption";

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
      alert("Wallet not connected");
      return;
    }

    if (applyingStudyId === studyId) {
      return;
    }

    setApplyingStudyId(studyId);

    const startTime = Date.now();
    console.log("🚀 [APPLY] ============================================");
    console.log("🚀 [APPLY] Starting study application process");
    console.log("🚀 [APPLY] Study ID:", studyId);
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
        studyId,
        zkReadyMedicalData,
        walletAddress
      );

      if (!result.success) {
        console.error("❌ [APPLY] Application failed:", result.message);
        throw new Error(result.message);
      }

      console.log("✅ [APPLY] Successfully enrolled in study!");
      console.log("✅ [APPLY] Application result:", result);

      // 3. Automatically encrypt and upload medical data
      console.log("🔐 [APPLY] Step 4: Encrypting and uploading medical data");
      try {
        // Get study's public key for encryption
        console.log("🔑 [APPLY] Fetching study's RSA public key...");
        const publicKeyResponse = await getStudyPublicKey(studyId);
        console.log("✅ [APPLY] Public key retrieved:", {
          publicKeyLength: publicKeyResponse.publicKey?.length,
        });
        
        // Encrypt the medical data using hybrid encryption
        console.log("🔐 [APPLY] Encrypting medical data with hybrid RSA+AES...");
        const encryptionStart = Date.now();
        const { encryptedData, encryptedKey } = await encryptMedicalDataForUpload(
          data, // Use the full aggregated medical data
          publicKeyResponse.publicKey
        );
        const encryptionDuration = Date.now() - encryptionStart;
        console.log("✅ [APPLY] Data encrypted successfully:", {
          encryptedDataLength: encryptedData.length,
          encryptedKeyLength: encryptedKey.length,
          durationMs: encryptionDuration,
        });

        // Compute hash of ENCRYPTED data for integrity verification
        console.log("🔐 [APPLY] Computing SHA-256 hash of encrypted data...");
        const encoder = new TextEncoder();
        const encryptedDataBuffer = encoder.encode(encryptedData); // Hash the encrypted data, not original
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encryptedDataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const dataHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        console.log("✅ [APPLY] Data hash computed from encrypted data:", dataHash);

        // Upload encrypted data
        console.log("📤 [APPLY] Uploading encrypted data to backend...");
        const uploadStart = Date.now();
        await uploadStudyData(studyId, {
          participantAddress: walletAddress,
          encryptedData,
          encryptionMetadata: {
            encryptedKey,
            iv: '', // IV is included in encryptedData
            authTag: '', // Auth tag is included in encryptedData
          },
          dataHash,
        });
        const uploadDuration = Date.now() - uploadStart;
        console.log("✅ [APPLY] Medical data successfully uploaded!", {
          durationMs: uploadDuration,
        });

        const totalDuration = Date.now() - startTime;
        console.log("🎉 [APPLY] ============================================");
        console.log("🎉 [APPLY] COMPLETE! Total duration:", totalDuration, "ms");
        console.log("🎉 [APPLY] ============================================");
      } catch (uploadError: any) {
        console.error("❌ [APPLY] ============================================");
        console.error("❌ [APPLY] Upload failed!");
        console.error("❌ [APPLY] Error:", uploadError);
        console.error("❌ [APPLY] Error message:", uploadError.message);
        console.error("❌ [APPLY] Error stack:", uploadError.stack);
        console.error("❌ [APPLY] ============================================");
        // Note: Don't throw here - enrollment was successful, upload can be retried
        alert(`Enrolled successfully, but data upload failed: ${uploadError.message}. Please contact support.`);
      }

      alert(`${result.message}\n\nYour medical data has been automatically encrypted and uploaded to the study.`);
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

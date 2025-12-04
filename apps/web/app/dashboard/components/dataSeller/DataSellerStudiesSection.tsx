"use client";

import { BookOpen, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useStudies } from "@/hooks/useStudies";
import DataSellerStudiesList from "@/app/dashboard/components/dataSeller/DataSellerStudiesList";
import EnrolledStudiesList from "@/app/dashboard/components/dataSeller/EnrolledStudiesList";
import StudySectionHeader from "@/app/dashboard/components/shared/StudySectionHeader";
import StudiesContainer from "@/app/dashboard/components/shared/StudiesContainer";
import DashboardSectionHeader from "@/app/dashboard/components/shared/DashboardSectionHeader";
import { useState, useEffect, useMemo } from "react";
import { getAggregatedMedicalData } from "@/services/core/medicalDataAggregator";
import { convertToZkReady } from "@/services/fhir";
import {
  StudyApplicationService,
  getEnrolledStudies,
  revokeStudyConsent,
  grantStudyConsent,
  getStudiesEligibility,
} from "@/services/api/studyService";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const criteriaOptions = [
  { key: "requiresAge", label: "Age" },
  { key: "requiresGender", label: "Gender" },
  { key: "requiresDiabetes", label: "Diabetes" },
  { key: "requiresSmoking", label: "Smoking" },
  { key: "requiresBMI", label: "BMI" },
  { key: "requiresBloodPressure", label: "Blood Pressure" },
  { key: "requiresCholesterol", label: "Cholesterol" },
  { key: "requiresHeartDisease", label: "Heart Disease" },
  { key: "requiresActivity", label: "Activity Level" },
  { key: "requiresHbA1c", label: "HbA1c" },
  { key: "requiresBloodType", label: "Blood Type" },
  { key: "requiresLocation", label: "Location" },
];

const statusOptions = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "completed", label: "Completed" },
  { key: "draft", label: "Draft" },
];

import eventBus from "@/lib/eventBus";
import { useTxStatusState } from "@/hooks/useTxStatus";
import { scaleMedicalData } from "@zk-medical/shared";
import { CustomConfirmAlert } from "@/components/alert/CustomConfirmAlert";
import { CheckCircle, Info } from "lucide-react";

type ViewMode = "enrolled" | "available";

export default function DataSellerStudiesSection() {
  const { address: walletAddress } = useAccount();
  const { studies, isLoading, error, refetch } = useStudies(walletAddress, true);
  const [applyingStudyId, setApplyingStudyId] = useState<number | null>(null);
  const [revokingStudyId, setRevokingStudyId] = useState<number | null>(null);
  const [grantingStudyId, setGrantingStudyId] = useState<number | null>(null);
  const [enrolledStudies, setEnrolledStudies] = useState<any[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("available");
  const { show, showError, isVisible: isTxProcessing } = useTxStatusState();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>(["active"]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStudyId, setPendingStudyId] = useState<number | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [studiesEligibility, setStudiesEligibility] = useState<
    Record<number, { canApply: boolean }>
  >({});

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

  useEffect(() => {
    if (walletAddress && studies.length > 0) {
      const studyIds = studies.map(s => s.id);
      setEligibilityLoading(true);
      getStudiesEligibility(walletAddress, studyIds)
        .then((eligibility) => {
          setStudiesEligibility(eligibility);
        })
        .catch((error) => console.error("Failed to fetch eligibility:", error))
        .finally(() => setEligibilityLoading(false));
    }
  }, [walletAddress, studies]);

  useEffect(() => {
    eventBus.on("studyCreated", refetch);
    eventBus.on("studyDeleted", refetch);

    return () => {
      eventBus.off("studyCreated", refetch);
      eventBus.off("studyDeleted", refetch);
    };
  }, [refetch]);

  const handleApplyToStudy = async (studyId: number) => {
    if (!walletAddress) {
      showError("Please connect your wallet to apply to studies");
      return;
    }

    if (applyingStudyId === studyId) {
      return;
    }

    setPendingStudyId(studyId);
    setShowConfirmDialog(true);
  };

  const handleConfirmApply = async () => {
    const studyId = pendingStudyId;
    if (!studyId || !walletAddress) return;

    setShowConfirmDialog(false);
    setPendingStudyId(null);
    setApplyingStudyId(studyId);

    try {
      show("Step 1/6: Starting study application process...");

      show("Step 2/6: Retrieving your encrypted medical data from IPFS...");
      const data = await getAggregatedMedicalData(walletAddress);

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No medical data found. Please upload your medical records first.");
      }

      show("Step 3/6: Preparing zero-knowledge proof inputs...");
      const zkReadyMedicalData = convertToZkReady(data);

      const scaledData = scaleMedicalData(zkReadyMedicalData);

      if (!scaledData) {
        throw new Error("Invalid medical data format. Please check your uploaded records.");
      }

      show("Step 4/5: Generating ZK proof and cryptographic commitment (this may take 30-60s)...");
      const result = await StudyApplicationService.applyToStudy(
        studyId,
        scaledData,
        walletAddress
      );

      if (result.success) {
        show(
          `Step 6/6: Success! ${result.message}\n\nYou can now view this study in your "Enrolled Studies" tab.`
        );

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

      const errorMessage = error.message || error.toString();
      const enhancedError =
        errorMessage.includes("not eligible") || errorMessage.includes("Not Eligible")
          ? `Not Eligible.\n\nYour medical data doesn't meet this study's requirements.`
          : errorMessage.includes("No medical data")
          ? `No Medical Data.\n\nPlease upload your medical records before applying to studies.\n\nTip: Go to Profile → Upload Medical Data`
          : `Not Eligible.\n\nYou don't meet the requirements for this study.`;

      showError(enhancedError);
      refetch();
    } finally {
      setApplyingStudyId(null);
    }
  };

  const handleRevokeConsent = async (studyId: number) => {
    if (!walletAddress) {
      showError("Please connect your wallet to revoke consent");
      return;
    }

    if (revokingStudyId === studyId) {
      return;
    }

    setRevokingStudyId(studyId);

    try {
      show("Step 1/3: Revoking consent on blockchain...");

      const result = await revokeStudyConsent(studyId, walletAddress);

      if (result.success) {
        show("Step 2/3: Updating database records...");
        eventBus.emit("consentChanged");
        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        show(
          "Step 3/3: Consent Revoked Successfully!\n\n" +
            (result.blockchainTxHash ? `\n Tx: ${result.blockchainTxHash.slice(0, 10)}...` : "")
        );
      }
    } catch (error) {
      console.error("Failed to revoke consent:", error);
      showError(
        `Consent Revocation Failed.\n\nUnable to revoke consent. Please try again in a moment.`
      );
    } finally {
      setRevokingStudyId(null);
    }
  };

  const handleGrantConsent = async (studyId: number) => {
    if (!walletAddress) {
      showError("Please connect your wallet to grant consent");
      return;
    }

    if (grantingStudyId === studyId) {
      return;
    }

    setGrantingStudyId(studyId);

    try {
      show("Step 1/3: Granting consent on blockchain...");

      const result = await grantStudyConsent(studyId, walletAddress);

      if (result.success) {
        show("Step 2/3: Updating your study records...");
        eventBus.emit("consentChanged");
        setEnrolledLoading(true);
        const updatedStudies = await getEnrolledStudies(walletAddress);
        setEnrolledStudies(updatedStudies);
        setEnrolledLoading(false);

        show("✓ Consent granted successfully!");
      }
    } catch (error) {
      console.error("Failed to grant consent:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("full") || errorMessage.includes("Full")) {
        showError(
          "Study Full.\n\n" + "This study has reached its maximum number of active participants."
        );
      } else if (
        errorMessage.includes("already active") ||
        errorMessage.includes("already granted")
      ) {
        showError("Already Active.\n\n" + "You have already granted consent for this study.");
      } else {
        showError(`Consent Failed.\n\nUnable to grant consent. Please try again in a moment.`);
      }
    } finally {
      setGrantingStudyId(null);
    }
  };

  const enrolledStudyIds = new Set(enrolledStudies.map((s) => s.id));
  const availableStudies = studies.filter((study) => !enrolledStudyIds.has(study.id));

  const filteredStudies = useMemo(() => {
    return availableStudies.filter((study) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (study.description && study.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Requirements filter
      const matchesFilters =
        selectedFilters.length === 0 ||
        selectedFilters.some(
          (filter) => study.criteriaSummary[filter as keyof typeof study.criteriaSummary]
        );

      // Status filter
      const matchesStatus =
        selectedStatusFilters.length === 0 ||
        selectedStatusFilters.includes(study.status || "active");

      return matchesSearch && matchesFilters && matchesStatus;
    });
  }, [availableStudies, searchQuery, selectedFilters, selectedStatusFilters]);

  return (
    <div className="w-full space-y-10 overflow-y-auto">
      <DashboardSectionHeader
        icon={<BookOpen className="h-8 w-8 text-white" />}
        title="Research Studies"
        description={
          viewMode === "available"
            ? "Discover and apply to participate in medical research"
            : "Manage your active study participations"
        }
        iconBackgroundClass={
          viewMode === "enrolled"
            ? "bg-gradient-to-br from-emerald-600 to-green-600"
            : "bg-gradient-to-br from-blue-600 to-indigo-600"
        }
      >
        {/* Sleek Tab Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
              {filteredStudies.length}
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
                  {filteredStudies.length} {filteredStudies.length === 1 ? "study" : "studies"}
                </span>
              </div>
            }
          />

          {/* Search and Filter Controls */}
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search studies by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Filter by Status{" "}
                    {selectedStatusFilters.length > 0 && `(${selectedStatusFilters.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {statusOptions.map(({ key, label }) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={selectedStatusFilters.includes(key)}
                      onSelect={(e) => {
                        e.preventDefault();
                        setSelectedStatusFilters((prev) =>
                          prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
                        );
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedStatusFilters([])}
                    disabled={selectedStatusFilters.length === 0}
                  >
                    Clear All Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Filter by Requirements{" "}
                    {selectedFilters.length > 0 && `(${selectedFilters.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {criteriaOptions.map(({ key, label }) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={selectedFilters.includes(key)}
                      onSelect={(e) => {
                        e.preventDefault();
                        setSelectedFilters((prev) =>
                          prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
                        );
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedFilters([])}
                    disabled={selectedFilters.length === 0}
                  >
                    Clear All Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <StudiesContainer
            isLoading={isLoading}
            error={error}
            studies={filteredStudies}
            onRetry={refetch}
            emptyState={{
              title: "No studies match your filters",
              description:
                "Try adjusting your search terms or filter requirements to see more studies.",
            }}
          >
            <DataSellerStudiesList
              studies={filteredStudies.map(study => {
                const eligibility = studiesEligibility[study.id];

                const canApply = eligibility?.canApply ?? study.canApply;
                
                return {
                  ...study,
                  canApply
                };
              })}
              onApplyToStudy={handleApplyToStudy}
              applyingStudyId={applyingStudyId}
              walletAddress={walletAddress}
              isTxProcessing={isTxProcessing}
              eligibilityLoading={eligibilityLoading}
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

      {/* Confirmation Dialog */}
      <CustomConfirmAlert
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        alertTitle="Application Confirmation"
        description={
          <div className="space-y-4 text-left">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900">Important: You can only apply once</p>
                  <p className="text-sm text-amber-800">
                    Once you apply to this study, you will not be able to submit a new application.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-blue-900">Verify your medical information</p>
                  <p className="text-sm text-blue-800">
                    Please ensure all required medical information for this study is available in
                    your profile:
                  </p>
                  <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 ml-2">
                    <li>Demographics (age, gender)</li>
                    <li>Relevant medical history</li>
                    <li>Required medical test results</li>
                    <li>Any other study-specific information</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to proceed with your application?
            </p>
          </div>
        }
        onConfirm={handleConfirmApply}
        onCancel={() => {
          setPendingStudyId(null);
          setShowConfirmDialog(false);
        }}
      />
    </div>
  );
}

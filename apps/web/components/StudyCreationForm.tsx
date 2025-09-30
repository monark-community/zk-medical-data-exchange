"use client";
/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCriteria, validateCriteria, STUDY_TEMPLATES } from "@zk-medical/shared";
import { useCreateStudy } from "@/services/api";
import { apiClient } from "@/services/core/apiClient";
import { useAccount } from "wagmi";
import { STUDY_FORM_MAPPINGS, DEFAULT_STUDY_INFO } from "@/constants/studyFormMappings";

// Template selector component
const TemplateSelector = ({
  onTemplateSelect,
}: {
  onTemplateSelect: (_template: any, _templateId: string) => void;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quick Start Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STUDY_FORM_MAPPINGS.templates.map((template) => (
          <div
            key={template.id}
            className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300"
            onClick={() =>
              onTemplateSelect(
                STUDY_TEMPLATES[template.id as keyof typeof STUDY_TEMPLATES],
                template.id
              )
            }
          >
            <h4 className="font-medium text-blue-700">{template.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Individual criteria component
const CriteriaField = ({
  label,
  enabled,
  onEnabledChange,
  children,
}: {
  label: string;
  enabled: boolean;
  onEnabledChange: (_enabled: boolean) => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center space-x-3 mb-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label className="font-medium text-gray-900">{label}</label>
      </div>
      {enabled && <div className="ml-7 space-y-3">{children}</div>}
    </div>
  );
};

// Range input component
const RangeInput = ({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  unit = "",
}: {
  label: string;
  minValue: number;
  maxValue: number;
  onMinChange: (_value: number) => void;
  onMaxChange: (_value: number) => void;
  unit?: string;
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-2 items-center">
        <div>
          <input
            type="number"
            value={minValue}
            onChange={(e) => onMinChange(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Min"
          />
          <span className="text-xs text-gray-500 ml-1">{unit}</span>
        </div>
        <span className="text-gray-500">to</span>
        <div>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Max"
          />
          <span className="text-xs text-gray-500 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );
};

interface StudyCreationFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

const StudyCreationForm = ({ onSuccess, isModal = false }: StudyCreationFormProps) => {
  // Basic study info
  const [studyInfo, setStudyInfo] = useState(DEFAULT_STUDY_INFO);

  // Study criteria state
  const [criteria, setCriteria] = useState(() => createCriteria());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  // Wagmi wallet hook
  const { address: walletAddress, isConnected } = useAccount();

  // Next.js router for navigation
  const router = useRouter();

  // API hook
  const { createStudy: createStudyApi } = useCreateStudy();

  // Reset form to initial state
  const resetForm = () => {
    setStudyInfo(DEFAULT_STUDY_INFO);
    setCriteria(createCriteria());
    setValidationErrors([]);
    setSelectedTemplate(undefined);
  };

  const handleTemplateSelect = (templateCriteria: any, templateId: string) => {
    setCriteria(templateCriteria);
    setSelectedTemplate(templateId);
    setValidationErrors([]);
  };

  const updateCriteria = (updates: Partial<typeof criteria>) => {
    const newCriteria = { ...criteria, ...updates };
    setCriteria(newCriteria);

    // Clear template selection since user is customizing
    setSelectedTemplate(undefined);

    // Validate on change
    const validation = validateCriteria(newCriteria);
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate criteria
      const validation = validateCriteria(criteria);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      console.log("Creating study via API...");

      // Check if wallet is connected
      if (!isConnected || !walletAddress) {
        alert("Please connect your wallet before creating a study.");
        return;
      }

      // Step 1: Call the backend API to create study in database
      const result = await createStudyApi(
        studyInfo.title,
        studyInfo.description,
        studyInfo.maxParticipants,
        studyInfo.durationDays,
        criteria,
        selectedTemplate,
        walletAddress // Pass wallet address
      );

      console.log("Study created in database:", result);

      // Step 2: Deploy to blockchain
      console.log("Deploying study to blockchain...");

      try {
        const deployResult = await apiClient.post(`/studies/${result.study.id}/deploy`);

        console.log("Blockchain deployment successful:", deployResult.data);

        alert(
          `🎉 Study "${result.study.title}" created and deployed successfully!\n\n` +
            `📊 Study Details:\n` +
            `• Complexity: ${result.study.stats.complexity}\n` +
            `• Enabled criteria: ${result.study.stats.enabledCriteriaCount}/12\n\n` +
            `⛓️ Blockchain Details:\n` +
            `• Contract: ${deployResult.data.deployment.contractAddress}\n` +
            `• Gas used: ${deployResult.data.deployment.gasUsed}\n` +
            `• View on Etherscan: ${deployResult.data.deployment.etherscanUrl}`
        );

        // Clear form and handle success
        resetForm();
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
      } catch (deployError) {
        console.error("Blockchain deployment failed:", deployError);
        alert(
          `⚠️ Study "${result.study.title}" was created in database but blockchain deployment failed.\n\n` +
            `Error: ${deployError instanceof Error ? deployError.message : "Unknown error"}\n\n` +
            `You can retry deployment later from the study management page.`
        );

        // Clear form and handle success even if blockchain deployment failed
        resetForm();
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to create study:", error);
      alert(`Failed to create study: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledCount = [
    criteria.enableAge,
    criteria.enableCholesterol,
    criteria.enableBMI,
    criteria.enableBloodType,
    criteria.enableGender,
    criteria.enableLocation,
    criteria.enableBloodPressure,
    criteria.enableHbA1c,
    criteria.enableSmoking,
    criteria.enableActivity,
    criteria.enableDiabetes,
    criteria.enableHeartDisease,
  ].filter((enabled) => enabled === 1).length;

  return (
    <div className="space-y-8">
      {/* Study Basic Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Study Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Study Title</label>
            <input
              type="text"
              value={studyInfo.title}
              onChange={(e) => setStudyInfo({ ...studyInfo, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Hypertension Management Study"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
            <input
              type="number"
              value={studyInfo.maxParticipants}
              onChange={(e) =>
                setStudyInfo({ ...studyInfo, maxParticipants: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={studyInfo.description}
              onChange={(e) => setStudyInfo({ ...studyInfo, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg h-20"
              placeholder="Describe your study objectives and methodology..."
            />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <TemplateSelector onTemplateSelect={handleTemplateSelect} />
      </div>

      {/* Criteria Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Eligibility Criteria</h2>
          <div className="text-sm text-gray-600">{enabledCount}/12 criteria enabled</div>
        </div>

        <div className="space-y-4">
          {/* Age Criteria */}
          <CriteriaField
            label="Age Requirements"
            enabled={criteria.enableAge === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableAge: enabled ? 1 : 0 })}
          >
            <RangeInput
              label="Age Range"
              minValue={criteria.minAge}
              maxValue={criteria.maxAge}
              onMinChange={(value) => updateCriteria({ minAge: value })}
              onMaxChange={(value) => updateCriteria({ maxAge: value })}
              unit="years"
            />
          </CriteriaField>

          {/* Gender Criteria */}
          <CriteriaField
            label="Gender Requirements"
            enabled={criteria.enableGender === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableGender: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Gender</label>
              <select
                value={criteria.allowedGender}
                onChange={(e) => updateCriteria({ allowedGender: Number(e.target.value) })}
                className="w-40 px-3 py-2 border rounded"
              >
                {STUDY_FORM_MAPPINGS.genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CriteriaField>

          {/* BMI Criteria */}
          <CriteriaField
            label="BMI Requirements"
            enabled={criteria.enableBMI === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableBMI: enabled ? 1 : 0 })}
          >
            <RangeInput
              label="BMI Range"
              minValue={criteria.minBMI / 10}
              maxValue={criteria.maxBMI / 10}
              onMinChange={(value) => updateCriteria({ minBMI: Math.round(value * 10) })}
              onMaxChange={(value) => updateCriteria({ maxBMI: Math.round(value * 10) })}
              unit="kg/m²"
            />
          </CriteriaField>

          {/* Cholesterol Criteria */}
          <CriteriaField
            label="Cholesterol Requirements"
            enabled={criteria.enableCholesterol === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableCholesterol: enabled ? 1 : 0 })}
          >
            <RangeInput
              label="Cholesterol Level"
              minValue={criteria.minCholesterol}
              maxValue={criteria.maxCholesterol}
              onMinChange={(value) => updateCriteria({ minCholesterol: value })}
              onMaxChange={(value) => updateCriteria({ maxCholesterol: value })}
              unit="mg/dL"
            />
          </CriteriaField>

          {/* Blood Pressure Criteria */}
          <CriteriaField
            label="Blood Pressure Requirements"
            enabled={criteria.enableBloodPressure === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableBloodPressure: enabled ? 1 : 0 })}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RangeInput
                label="Systolic Pressure"
                minValue={criteria.minSystolic}
                maxValue={criteria.maxSystolic}
                onMinChange={(value) => updateCriteria({ minSystolic: value })}
                onMaxChange={(value) => updateCriteria({ maxSystolic: value })}
                unit="mmHg"
              />
              <RangeInput
                label="Diastolic Pressure"
                minValue={criteria.minDiastolic}
                maxValue={criteria.maxDiastolic}
                onMinChange={(value) => updateCriteria({ minDiastolic: value })}
                onMaxChange={(value) => updateCriteria({ maxDiastolic: value })}
                unit="mmHg"
              />
            </div>
          </CriteriaField>

          {/* Smoking Status */}
          <CriteriaField
            label="Smoking Status"
            enabled={criteria.enableSmoking === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableSmoking: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Smoking Status
              </label>
              <select
                value={criteria.allowedSmoking}
                onChange={(e) => updateCriteria({ allowedSmoking: Number(e.target.value) })}
                className="w-48 px-3 py-2 border rounded"
              >
                {STUDY_FORM_MAPPINGS.smokingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CriteriaField>

          {/* Location/Region Requirements */}
          <CriteriaField
            label="Location/Region Requirements"
            enabled={criteria.enableLocation === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableLocation: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Regions (select up to 4)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_FORM_MAPPINGS.regions.map((region) => {
                  const isSelected = criteria.allowedRegions.includes(region.value);
                  const selectedCount = criteria.allowedRegions.filter((r) => r > 0).length;
                  const canSelect = isSelected || selectedCount < 4;

                  return (
                    <label key={region.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newRegions = [...criteria.allowedRegions] as [
                            number,
                            number,
                            number,
                            number
                          ];

                          if (e.target.checked) {
                            // Find first empty slot and add the region
                            const emptyIndex = newRegions.findIndex((r) => r === 0);
                            if (emptyIndex !== -1) {
                              newRegions[emptyIndex] = region.value;
                            }
                          } else {
                            // Remove the region by replacing it with 0
                            const regionIndex = newRegions.findIndex((r) => r === region.value);
                            if (regionIndex !== -1) {
                              newRegions[regionIndex] = 0;
                            }
                          }

                          updateCriteria({ allowedRegions: newRegions });
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                        disabled={!canSelect}
                      />
                      <span className="text-sm">{region.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CriteriaField>

          {/* Blood Type Requirements */}
          <CriteriaField
            label="Blood Type Requirements"
            enabled={criteria.enableBloodType === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableBloodType: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Blood Types (select up to 4)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {STUDY_FORM_MAPPINGS.bloodTypes.map((bloodType) => {
                  const isSelected = criteria.allowedBloodTypes.includes(bloodType.value);
                  const selectedCount = criteria.allowedBloodTypes.filter((bt) => bt > 0).length;
                  const canSelect = isSelected || selectedCount < 4;

                  return (
                    <label key={bloodType.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newBloodTypes = [...criteria.allowedBloodTypes] as [
                            number,
                            number,
                            number,
                            number
                          ];

                          if (e.target.checked) {
                            // Find first empty slot and add the blood type
                            const emptyIndex = newBloodTypes.findIndex((bt) => bt === 0);
                            if (emptyIndex !== -1) {
                              newBloodTypes[emptyIndex] = bloodType.value;
                            }
                          } else {
                            // Remove the blood type by replacing it with 0
                            const bloodTypeIndex = newBloodTypes.findIndex(
                              (bt) => bt === bloodType.value
                            );
                            if (bloodTypeIndex !== -1) {
                              newBloodTypes[bloodTypeIndex] = 0;
                            }
                          }

                          updateCriteria({ allowedBloodTypes: newBloodTypes });
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                        disabled={!canSelect}
                      />
                      <span className="text-sm">{bloodType.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CriteriaField>

          {/* HbA1c Requirements */}
          <CriteriaField
            label="HbA1c Requirements (Diabetes Marker)"
            enabled={criteria.enableHbA1c === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableHbA1c: enabled ? 1 : 0 })}
          >
            <RangeInput
              label="HbA1c Level"
              minValue={criteria.minHbA1c / 10}
              maxValue={criteria.maxHbA1c / 10}
              onMinChange={(value) => updateCriteria({ minHbA1c: Math.round(value * 10) })}
              onMaxChange={(value) => updateCriteria({ maxHbA1c: Math.round(value * 10) })}
              unit="%"
            />
          </CriteriaField>

          {/* Activity Level Requirements */}
          <CriteriaField
            label="Physical Activity Level"
            enabled={criteria.enableActivity === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableActivity: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level Range
              </label>
              <div className="flex space-x-2 items-center">
                <div>
                  <select
                    value={criteria.minActivityLevel}
                    onChange={(e) => updateCriteria({ minActivityLevel: Number(e.target.value) })}
                    className="w-32 px-2 py-1 border rounded"
                  >
                    {STUDY_FORM_MAPPINGS.activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500">to</span>
                <div>
                  <select
                    value={criteria.maxActivityLevel}
                    onChange={(e) => updateCriteria({ maxActivityLevel: Number(e.target.value) })}
                    className="w-32 px-2 py-1 border rounded"
                  >
                    {STUDY_FORM_MAPPINGS.activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CriteriaField>

          {/* Diabetes History Requirements */}
          <CriteriaField
            label="Diabetes History"
            enabled={criteria.enableDiabetes === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableDiabetes: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diabetes Status
              </label>
              <select
                value={criteria.allowedDiabetes}
                onChange={(e) => updateCriteria({ allowedDiabetes: Number(e.target.value) })}
                className="w-48 px-3 py-2 border rounded"
              >
                {STUDY_FORM_MAPPINGS.diabetesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CriteriaField>

          {/* Heart Disease History Requirements */}
          <CriteriaField
            label="Heart Disease History"
            enabled={criteria.enableHeartDisease === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableHeartDisease: enabled ? 1 : 0 })}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Disease Status
              </label>
              <select
                value={criteria.allowedHeartDisease}
                onChange={(e) => updateCriteria({ allowedHeartDisease: Number(e.target.value) })}
                className="w-48 px-3 py-2 border rounded"
              >
                {STUDY_FORM_MAPPINGS.heartDiseaseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CriteriaField>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">Please fix these issues:</h3>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Wallet Connection Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Wallet Connection</h3>
            <p className="text-sm text-gray-600">
              {isConnected && walletAddress
                ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect your wallet using the wallet menu to create studies"}
            </p>
          </div>
          {!isConnected ? (
            <div className="text-amber-600 font-medium">⚠️ Please connect wallet to continue</div>
          ) : (
            <div className="text-green-600 font-medium">
              ✅ Wallet Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Ready to Create Study?</h3>
            <p className="text-sm text-gray-600">
              {enabledCount === 0
                ? "Open study - anyone can join"
                : enabledCount === 1
                ? "Simple study with 1 criteria"
                : `Comprehensive study with ${enabledCount} criteria`}
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !studyInfo.title || validationErrors.length > 0 || !isConnected
            }
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {isSubmitting ? "Creating..." : "🚀 Create Study"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyCreationForm;

"use client";
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCriteria, validateCriteria, STUDY_TEMPLATES } from "@zk-medical/shared";
import { useCreateStudy, deployStudy, deleteStudy } from "@/services/api/studyService";
import { useAccount } from "wagmi";
import { STUDY_FORM_MAPPINGS, DEFAULT_STUDY_INFO } from "@/constants/studyFormMappings";

// Template selector component
const TemplateSelector = ({
  onTemplateSelect,
  selectedTemplate,
  onClearTemplate,
}: {
  onTemplateSelect: (_template: any, _templateId: string) => void;
  selectedTemplate?: string;
  onClearTemplate: () => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Start Templates</h3>
          <p className="text-gray-600 text-sm">
            Choose a template to get started quickly, or customize your own criteria below.
            {selectedTemplate && (
              <span className="ml-2 text-blue-600 font-medium">
                Currently using:{" "}
                {STUDY_FORM_MAPPINGS.templates.find((t) => t.id === selectedTemplate)?.name}
              </span>
            )}
          </p>
        </div>
        {selectedTemplate && (
          <Button
            onClick={onClearTemplate}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-800 border-gray-300"
          >
            Clear Template
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STUDY_FORM_MAPPINGS.templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <div
              key={template.id}
              className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-gradient-to-br from-blue-100 to-blue-50 shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50"
              }`}
              onClick={() =>
                onTemplateSelect(
                  STUDY_TEMPLATES[template.id as keyof typeof STUDY_TEMPLATES],
                  template.id
                )
              }
            >
              {/* Selection indicator */}
              <div
                className={`absolute top-4 right-4 w-6 h-6 rounded-full transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 opacity-100 scale-100"
                    : "bg-blue-500 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-white absolute top-1 left-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Selected badge */}
              {isSelected && (
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SELECTED
                </div>
              )}

              <h4
                className={`font-semibold mb-3 transition-colors ${
                  isSelected ? "text-blue-700" : "text-gray-900 group-hover:text-blue-700"
                }`}
              >
                {template.name}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
            </div>
          );
        })}
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
    <div
      className={`relative p-6 border-2 rounded-xl transition-all duration-200 ${
        enabled
          ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
          />
          {enabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <label
          className="font-semibold text-gray-900 text-lg cursor-pointer"
          onClick={() => onEnabledChange(!enabled)}
        >
          {label}
        </label>
      </div>
      {enabled && (
        <div className="ml-9 space-y-4 animate-in slide-in-from-top-2 duration-300">{children}</div>
      )}
    </div>
  );
};

// Number input component with empty value support
const NumberInput = ({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    // Allow empty string to clear the field
    if (newValue === "") {
      return;
    }

    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // If field is empty on blur, restore the original value
    if (displayValue === "" || isNaN(Number(displayValue))) {
      setDisplayValue(value.toString());
      onBlur?.(value);
    } else {
      const numValue = Number(displayValue);
      // Apply min/max constraints
      let constrainedValue = numValue;
      if (min !== undefined && numValue < min) constrainedValue = min;
      if (max !== undefined && numValue > max) constrainedValue = max;

      setDisplayValue(constrainedValue.toString());
      onChange(constrainedValue);
      onBlur?.(constrainedValue);
    }
  };

  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      min={min}
      max={max}
    />
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
  absoluteMin,
  absoluteMax,
}: {
  label: string;
  minValue: number;
  maxValue: number;
  onMinChange: (_value: number) => void;
  onMaxChange: (_value: number) => void;
  unit?: string;
  absoluteMin?: number;
  absoluteMax?: number;
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <NumberInput
              value={minValue}
              onChange={onMinChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-center font-medium"
              placeholder="Min"
              min={absoluteMin}
              max={absoluteMax}
            />
            {unit && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div className="px-3 py-2 bg-gray-100 rounded-lg">
          <span className="text-gray-600 font-medium text-sm">to</span>
        </div>
        <div className="flex-1">
          <div className="relative">
            <NumberInput
              value={maxValue}
              onChange={onMaxChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-center font-medium"
              placeholder="Max"
              min={absoluteMin}
              max={absoluteMax}
            />
            {unit && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StudyCreationFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onSubmitStateChange?: (isSubmitting: boolean) => void;
}

const StudyCreationForm = ({
  onSuccess,
  isModal = false,
  onSubmitStateChange,
}: StudyCreationFormProps) => {
  // Basic study info
  const [studyInfo, setStudyInfo] = useState(DEFAULT_STUDY_INFO);

  // Study criteria state
  const [criteria, setCriteria] = useState(() => createCriteria());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  // Notify parent component when submit state changes
  useEffect(() => {
    onSubmitStateChange?.(isSubmitting);
  }, [isSubmitting, onSubmitStateChange]);

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

  const handleClearTemplate = () => {
    setCriteria(createCriteria());
    setSelectedTemplate(undefined);
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
        walletAddress
      );

      console.log("Study created in database:", result);

      // Step 2: Deploy to blockchain
      console.log("Deploying study to blockchain...");

      try {
        const deployResult = await deployStudy(result.study.id);

        console.log("Blockchain deployment successful:", deployResult);

        alert(
          `🎉 Study "${result.study.title}" created and deployed successfully!\n\n` +
            `📊 Study Details:\n` +
            `• Complexity: ${result.study.stats.complexity}\n` +
            `• Enabled criteria: ${result.study.stats.enabledCriteriaCount}/12\n\n` +
            `⛓️ Blockchain Details:\n` +
            `• Contract: ${deployResult.deployment.contractAddress}\n` +
            `• Gas used: ${deployResult.deployment.gasUsed}\n` +
            `• View on Etherscan: ${deployResult.deployment.etherscanUrl}`
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

        // Delete the study from database since deployment failed
        try {
          await deleteStudy(result.study.id, walletAddress!);
          console.log("Study deleted from database due to deployment failure");
        } catch (deleteError) {
          console.error("Failed to delete study after deployment failure:", deleteError);
        }

        alert(
          `❌ Study creation failed during blockchain deployment.\n\n` +
            `Error: ${deployError instanceof Error ? deployError.message : "Unknown error"}\n\n` +
            `Please try creating the study again.`
        );

        // Don't reset form or navigate on failure, let user try again
        return;
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
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Study Basic Info */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Information</h2>
          <p className="text-gray-600">Provide basic details about your medical research study.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Study Title</label>
            <input
              type="text"
              value={studyInfo.title}
              onChange={(e) => setStudyInfo({ ...studyInfo, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="e.g., Hypertension Management Study"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Max Participants</label>
            <NumberInput
              value={studyInfo.maxParticipants}
              onChange={(value) => setStudyInfo({ ...studyInfo, maxParticipants: value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              min={1}
              placeholder="Enter maximum participants"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Duration (Days)</label>
            <NumberInput
              value={studyInfo.durationDays}
              onChange={(value) => setStudyInfo({ ...studyInfo, durationDays: value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              min={1}
              max={365}
              placeholder="Enter study duration in days"
            />
          </div>
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={studyInfo.description}
              onChange={(e) => setStudyInfo({ ...studyInfo, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl h-24 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
              placeholder="Describe your study objectives and methodology..."
            />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg border border-blue-100">
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
          onClearTemplate={handleClearTemplate}
        />
      </div>

      {/* Criteria Configuration */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Eligibility Criteria</h2>
            <div className="flex items-center space-x-3">
              <p className="text-gray-600">
                Define the requirements participants must meet to join your study.
              </p>
              {selectedTemplate ? (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  Template:{" "}
                  {STUDY_FORM_MAPPINGS.templates.find((t) => t.id === selectedTemplate)?.name}
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                  Custom Configuration
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-full text-sm">
              {enabledCount}/12 criteria enabled
            </div>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${(enabledCount / 12) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
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
              absoluteMin={0}
              absoluteMax={150}
            />
          </CriteriaField>

          {/* Gender Criteria */}
          <CriteriaField
            label="Gender Requirements"
            enabled={criteria.enableGender === 1}
            onEnabledChange={(enabled) => updateCriteria({ enableGender: enabled ? 1 : 0 })}
          >
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Allowed Gender</label>
              <select
                value={criteria.allowedGender}
                onChange={(e) => {
                  updateCriteria({ allowedGender: Number(e.target.value) });
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
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
              absoluteMin={10.0}
              absoluteMax={80.0}
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
              absoluteMin={0}
              absoluteMax={1000}
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
                absoluteMin={70}
                absoluteMax={250}
              />
              <RangeInput
                label="Diastolic Pressure"
                minValue={criteria.minDiastolic}
                maxValue={criteria.maxDiastolic}
                onMinChange={(value) => updateCriteria({ minDiastolic: value })}
                onMaxChange={(value) => updateCriteria({ maxDiastolic: value })}
                unit="mmHg"
                absoluteMin={40}
                absoluteMax={150}
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
              absoluteMin={4.0}
              absoluteMax={20.0}
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
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Wallet Connection</h3>
            <p className="text-sm text-gray-600">
              {isConnected && walletAddress
                ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect your wallet using the wallet menu to create studies"}
            </p>
          </div>
          {!isConnected ? (
            <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Please connect wallet to continue</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">
                Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Ready to Deploy Your Study?</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              {enabledCount === 0
                ? "Open study - anyone can join your research"
                : enabledCount === 1
                ? "Simple study with 1 eligibility criteria"
                : `Comprehensive study with ${enabledCount} eligibility criteria`}
            </p>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>ZK-powered privacy protection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Blockchain deployment</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !studyInfo.title || validationErrors.length > 0 || !isConnected
            }
            className="bg-white text-blue-700 hover:bg-gray-50 font-bold px-8 py-4 text-lg rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-700 inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Study...
              </>
            ) : (
              "Create Study"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyCreationForm;

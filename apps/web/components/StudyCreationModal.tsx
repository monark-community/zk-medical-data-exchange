/**
 * Study Creation Modal Component
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StudyCreationForm from "./StudyCreationForm";

interface StudyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudyCreated?: () => void;
}

export default function StudyCreationModal({
  isOpen,
  onClose,
  onStudyCreated,
}: StudyCreationModalProps) {
  const [isCreatingStudy, setIsCreatingStudy] = useState(false);

  const handleStudyCreated = () => {
    setIsCreatingStudy(false);
    // Call the optional callback
    onStudyCreated?.();
    // Close the modal
    onClose();
  };

  const handleSubmitStateChange = (isSubmitting: boolean) => {
    setIsCreatingStudy(isSubmitting);
  };

  const handleCloseClick = () => {
    if (isCreatingStudy) {
      // Show confirmation if study is being created
      if (window.confirm("Study creation is in progress. Are you sure you want to cancel?")) {
        setIsCreatingStudy(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCreatingStudy) {
        onClose();
      } else if (e.key === "Escape" && isCreatingStudy) {
        // Show confirmation if study is being created
        if (window.confirm("Study creation is in progress. Are you sure you want to cancel?")) {
          setIsCreatingStudy(false);
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isCreatingStudy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black ${
          isCreatingStudy ? 'bg-opacity-70' : 'bg-opacity-50'
        }`} 
        onClick={isCreatingStudy ? undefined : handleCloseClick}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden mx-4">
        {/* Loading Overlay */}
        {isCreatingStudy && (
          <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Study</h3>
              <p className="text-gray-600">Please wait while we deploy your study to the blockchain...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Medical Study</h2>
              <p className="text-gray-600 mt-1">
                Configure eligibility criteria and deploy your ZK-powered medical research study
              </p>
            </div>
            <Button 
              onClick={handleCloseClick} 
              variant="outline" 
              size="sm" 
              className={`h-8 w-8 p-0 ${
                isCreatingStudy ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isCreatingStudy}
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6">
            <StudyCreationForm 
              onSuccess={handleStudyCreated} 
              isModal={true}
              onSubmitStateChange={handleSubmitStateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

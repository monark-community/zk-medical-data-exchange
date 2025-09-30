/**
 * Study Creation Modal Component
 * Provides inline study creation without page navigation
 */

"use client";

import { useEffect } from "react";
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
  const handleStudyCreated = () => {
    // Call the optional callback
    onStudyCreated?.();
    // Close the modal
    onClose();
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Medical Study</h2>
              <p className="text-gray-600 mt-1">
                Configure eligibility criteria and deploy your ZK-powered medical research study
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm" className="h-8 w-8 p-0">
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6">
            <StudyCreationForm onSuccess={handleStudyCreated} isModal={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

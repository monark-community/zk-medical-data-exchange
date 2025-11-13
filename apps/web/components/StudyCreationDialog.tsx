"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StudyCreationForm from "./StudyCreationForm";

interface StudyCreationDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  onStudyCreated?: () => void;
}

export default function StudyCreationDialog({
  open,
  onOpenChange,
  onStudyCreated,
}: StudyCreationDialogProps) {
  const [isCreatingStudy, setIsCreatingStudy] = useState(false);

  const handleStudyCreated = () => {
    setIsCreatingStudy(false);
    onStudyCreated?.();
    onOpenChange(false);
  };

  const handleSubmitStateChange = (isSubmitting: boolean) => {
    setIsCreatingStudy(isSubmitting);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isCreatingStudy) {
      if (window.confirm("Study creation is in progress. Are you sure you want to cancel?")) {
        setIsCreatingStudy(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!max-w-6xl !w-[85vw] max-h-[95vh] h-[95vh] overflow-hidden p-0"
        style={{ maxWidth: "min(1152px, 85vw)", width: "85vw" }}
      >
        {/* Loading Overlay */}
        {isCreatingStudy && (
          <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-primary mx-auto mb-4"
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
              <h3 className="text-lg font-semibold mb-2">Creating Your Study</h3>
              <p className="text-muted-foreground">
                Please wait while we deploy your study to the blockchain...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold">Create Medical Study</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Configure eligibility criteria and deploy your ZK-powered medical research study
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8">
          <StudyCreationForm
            onSuccess={handleStudyCreated}
            isModal={true}
            onSubmitStateChange={handleSubmitStateChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

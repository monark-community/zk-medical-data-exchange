"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StudyCreationForm from "./StudyCreationForm";
import { useTxStatusState } from "@/hooks/useTxStatus";

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
  const { isVisible: isTxInProgress } = useTxStatusState();

  const handleStudyCreated = () => {
    onStudyCreated?.();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isTxInProgress) {
      if (window.confirm("Study creation is in progress. Are you sure you want to cancel?")) {
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
          <StudyCreationForm onSuccess={handleStudyCreated} isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

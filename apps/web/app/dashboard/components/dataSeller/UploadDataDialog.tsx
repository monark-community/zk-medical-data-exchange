import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MedicalDataUpload } from '@/components/MedicalDataUpload';

interface UploadDataDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (isOpen: boolean) => void;
  studyId: number;
  studyTitle: string;
  onUploadComplete?: () => void;
}

export function UploadDataDialog({
  open,
  onOpenChange,
  studyId,
  studyTitle,
  onUploadComplete,
}: UploadDataDialogProps) {
  const handleUploadComplete = () => {
    if (onUploadComplete) {
      onUploadComplete();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Medical Data</DialogTitle>
          <DialogDescription>
            Upload your medical data for: <span className="font-semibold">{studyTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <MedicalDataUpload 
          studyId={studyId} 
          studyTitle={studyTitle}
          onUploadComplete={handleUploadComplete}
        />
      </DialogContent>
    </Dialog>
  );
}

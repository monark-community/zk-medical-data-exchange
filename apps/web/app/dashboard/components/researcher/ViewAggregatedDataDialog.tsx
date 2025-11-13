import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AggregatedDataView } from '@/components/AggregatedDataView';

interface ViewAggregatedDataDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (isOpen: boolean) => void;
  studyId: number;
  studyAddress: string;
  studyTitle: string;
  studyStatus: string;
  isCreator: boolean;
}

export function ViewAggregatedDataDialog({
  open,
  onOpenChange,
  studyId,
  studyAddress,
  studyTitle,
  studyStatus,
  isCreator,
}: ViewAggregatedDataDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggregated Study Data</DialogTitle>
          <DialogDescription>
            Anonymized statistics for: <span className="font-semibold">{studyTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <AggregatedDataView 
          studyId={studyId}
          studyAddress={studyAddress}
          studyStatus={studyStatus}
          isCreator={isCreator}
        />
      </DialogContent>
    </Dialog>
  );
}

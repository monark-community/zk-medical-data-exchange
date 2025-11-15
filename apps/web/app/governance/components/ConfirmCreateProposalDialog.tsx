"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmCreateProposalDialogProps {
  open: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  proposalTitle: string;
}

const ConfirmCreateProposalDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  proposalTitle,
}: ConfirmCreateProposalDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Proposal Creation</DialogTitle>
          <DialogDescription>
            Are you sure you want to create this proposal?
            {proposalTitle && (
              <div className="mt-2 font-semibold text-foreground">"{proposalTitle}"</div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
            Confirm
          </Button>
          <DialogClose asChild>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmCreateProposalDialog;

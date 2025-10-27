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

interface ConfirmEditUsernameDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmEditUsernameDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ConfirmEditUsernameDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm New Username</DialogTitle>
          <DialogDescription>Are you sure you want to change your username?</DialogDescription>
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

export default ConfirmEditUsernameDialog;

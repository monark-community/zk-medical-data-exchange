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
  DialogTrigger,
} from "@/components/ui/dialog";

import EditProfileField from "./editProfileField";

interface EditProfileDialogProps {
  onProfileUpdate: () => void;
  isProcessing?: boolean;
}

const EditProfileDialog = ({ onProfileUpdate, isProcessing = false }: EditProfileDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onProfileUpdate();
  };

  const handleProcessingStart = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Edit Username"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Username</DialogTitle>
          <DialogDescription>Update your username</DialogDescription>
        </DialogHeader>
        <EditProfileField onSuccess={handleSuccess} onProcessingStart={handleProcessingStart} />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button className="bg-red-600 hover:bg-red-700">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;

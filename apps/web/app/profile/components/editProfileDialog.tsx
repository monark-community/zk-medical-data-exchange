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
}

const EditProfileDialog = ({ onProfileUpdate }: EditProfileDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onProfileUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your username and profile picture</DialogDescription>
        </DialogHeader>
        <EditProfileField onSuccess={handleSuccess} />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button className="bg-red-600 hover:bg-red-700">cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;

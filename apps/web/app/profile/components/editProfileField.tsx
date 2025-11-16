"use client";
import React from "react";
import { Button } from "@/components/ui/button";

import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/services/api/userService";
import { useAccount } from "wagmi";
import ConfirmEditUsernameDialog from "./confirmEditUsernameDialog";

import { notifyUserUpdated } from "@/utils/userEvents";

import CustomAlert from "@/components/alert/CustomAlert";
interface EditProfileFieldProps {
  onSuccess: () => void;
}

const EditProfileField = ({ onSuccess }: EditProfileFieldProps) => {
  const { address: walletAddress } = useAccount();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
  const [isWaitingUsernameChange, setIsWaitingUsernameChange] = React.useState(false);
  const [pendingUsername, setPendingUsername] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const openResultAlertDialog = () => {
    setIsAlertDialogOpen(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      if (!walletAddress) {
        setError("Wallet address not found. Please log in again.");
        setIsAlertDialogOpen(true);
        return;
      }
      setIsWaitingUsernameChange(true);
      openResultAlertDialog();
      await updateUser(walletAddress, { username: pendingUsername });
      setIsWaitingUsernameChange(false);
      notifyUserUpdated();
      setError(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while saving changes.");
      setIsAlertDialogOpen(true);
    }
  };

  const handleAlertClose = () => {
    setIsAlertDialogOpen(false);
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const username = (document.getElementById("edit-username") as HTMLInputElement).value;

          if (!walletAddress) {
            setError("Wallet address not found. Please log in again.");
            return;
          }

          setPendingUsername(username);
          setIsDialogOpen(true);
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-username">New Username</FieldLabel>
                <Input
                  id="edit-username"
                  placeholder="Enter your new username"
                  required
                  pattern="^[a-zA-Z_]{4,10}$"
                  title="Username must be 4-10 characters long, can include letters and underscores, no spaces or special characters."
                />
              </Field>

              <Field>
                <FieldDescription>
                  Both usernames must match and follow the pattern: 4-10 letters, no spaces or
                  special characters.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Save Changes</Button>
          </Field>
        </FieldGroup>
      </form>

      <ConfirmEditUsernameDialog
        open={isDialogOpen}
        onOpenChange={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmUpdate}
        onCancel={() => {
          setError(null);
          setPendingUsername("");
        }}
      />
      <CustomAlert
        isAlertDialogOpen={isAlertDialogOpen}
        isWaitingForAction={isWaitingUsernameChange}
        error={error}
        successMessage="Your changes have been saved."
        handleAlertClose={handleAlertClose}
      />
    </div>
  );
};

export default EditProfileField;

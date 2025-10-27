"use client";
import React from "react";
import { Button } from "@/components/ui/button";

import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/services/api/userService";
import { useAccount } from "wagmi";
import ConfirmEditUsernameDialog from "./confirmEditUsernameDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
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
              {/* <Field>
                <FieldLabel htmlFor="change-profile-pic">Profile Picture</FieldLabel>
                <Input id="change-profile-pic" type="file" accept="image/*" />
                <FieldDescription>Upload a new profile picture</FieldDescription>
              </Field> */}
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Save Changes</Button>
          </Field>
        </FieldGroup>
      </form>

      <ConfirmEditUsernameDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmUpdate}
        onCancel={() => {
          setError(null);
          setPendingUsername("");
        }}
      />
      <AlertDialog open={isAlertDialogOpen}>
        {isWaitingUsernameChange ? (
          <AlertDialogContent className="flex justify-center items-center p-16">
            <Spinner className="w-12 h-12" />
          </AlertDialogContent>
        ) : (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{error ? "Error" : "Success"}</AlertDialogTitle>
              <AlertDialogDescription>
                {error ? error : "Your changes have been saved."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleAlertClose}>Ok</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
};

export default EditProfileField;

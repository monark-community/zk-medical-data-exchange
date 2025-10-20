"use client";
import React from "react";
import { Button } from "@/components/ui/button";

import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/services/api/userService";
import { useAccount } from "wagmi";

interface EditProfileFieldProps {
  onSuccess: () => void;
}

const EditProfileField = ({ onSuccess }: EditProfileFieldProps) => {
  const { address: walletAddress } = useAccount();

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const username = (document.getElementById("edit-username") as HTMLInputElement).value;
          const repeatUsername = (document.getElementById("repeat-username") as HTMLInputElement)
            .value;

          if (username !== repeatUsername) {
            alert("Usernames do not match!");
            return;
          }

          try {
            // Get wallet address from localStorage

            if (!walletAddress) {
              alert("Wallet address not found. Please log in again.");
              return;
            }

            // Call updateUser function with the updated username
            const updatedUser = await updateUser(walletAddress, { username });

            console.log("User updated successfully:", updatedUser);
            alert("Changes saved successfully!");

            // Close dialog and refresh profile data
            onSuccess();
          } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred while saving changes.");
          }
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
                <FieldLabel htmlFor="repeat-username">Repeat Username</FieldLabel>
                <Input
                  id="repeat-username"
                  placeholder="Repeat your new username"
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
    </div>
  );
};

export default EditProfileField;

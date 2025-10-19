"use client";
import React from "react";
import { Button } from "@/components/ui/button";

import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EditProfileField = () => {
  return (
    <div className="w-full max-w-md">
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-username">Username</FieldLabel>
                <Input id="edit-username" placeholder="Enter your username" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="change-profile-pic">Profile Picture</FieldLabel>
                <Input id="change-profile-pic" type="file" accept="image/*" />
                <FieldDescription>Upload a new profile picture</FieldDescription>
              </Field>
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

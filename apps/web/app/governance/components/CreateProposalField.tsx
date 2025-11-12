"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProposal } from "@/services/api/governanceService";
import { CreateProposalParams } from "@/interfaces/proposal";
import { useAccount } from "wagmi";
import ConfirmCreateProposalDialog from "@/app/governance/components/ConfirmCreateProposalDialog";
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

interface CreateProposalFieldProps {
  onSuccess: () => void;
}

const CreateProposalField = ({ onSuccess }: CreateProposalFieldProps) => {
  const { address: walletAddress } = useAccount();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
  const [isWaitingProposalCreation, setIsWaitingProposalCreation] = React.useState(false);
  const [pendingProposal, setPendingProposal] = React.useState<CreateProposalParams | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("");
  const [duration, setDuration] = React.useState<string>("");

  const openResultAlertDialog = () => {
    setIsAlertDialogOpen(true);
  };

  const handleConfirmCreate = async () => {
    try {
      if (!walletAddress) {
        setError("Wallet address not found. Please log in again.");
        setIsAlertDialogOpen(true);
        return;
      }

      if (!pendingProposal) {
        setError("Proposal data is missing.");
        setIsAlertDialogOpen(true);
        return;
      }

      setIsWaitingProposalCreation(true);
      openResultAlertDialog();

      const result = await createProposal(pendingProposal);

      setIsWaitingProposalCreation(false);

      if (result.success) {
        setError(null);
      } else {
        setError(result.error || "Failed to create proposal");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      setError("An error occurred while creating the proposal.");
      setIsWaitingProposalCreation(false);
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
          const title = (document.getElementById("proposal-title") as HTMLInputElement).value;
          const description = (
            document.getElementById("proposal-description") as HTMLTextAreaElement
          ).value;
          console.log(`Creating proposal:`, { title, description, category, duration });
          if (!walletAddress) {
            setError("Wallet address not found. Please log in again.");
            openResultAlertDialog();
            return;
          }

          const days = parseInt(duration, 10) || 0;

          // convert days to seconds
          const durationSeconds = days * 24 * 60 * 60;
          const proposal: CreateProposalParams = {
            title,
            description,
            category: parseInt(category, 10),
            walletAddress,
            // store as UTC unix timestamp (seconds) when the proposal will close
            duration: durationSeconds,
          };

          setPendingProposal(proposal);
          setIsDialogOpen(true);
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="proposal-title">Proposal Title</FieldLabel>
                <Input
                  id="proposal-title"
                  placeholder="Enter proposal title"
                  required
                  minLength={10}
                  maxLength={80}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="proposal-description">Description</FieldLabel>
                <Textarea
                  id="proposal-description"
                  placeholder="Describe your proposal in detail"
                  required
                  minLength={20}
                  maxLength={500}
                  rows={5}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="proposal-category">Category</FieldLabel>
                <Select name="category" required value={category} onValueChange={setCategory}>
                  <SelectTrigger id="proposal-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Economics</SelectItem>
                    <SelectItem value="1">Privacy</SelectItem>
                    <SelectItem value="2">Governance</SelectItem>
                    <SelectItem value="3">Policy</SelectItem>
                    <SelectItem value="4">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="proposal-duration">Open Duration / Active Period</FieldLabel>
                <Select name="duration" required value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="proposal-duration">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => {
                      const days = i + 1;
                      return (
                        <SelectItem key={days} value={String(days)}>
                          {days} day{days > 1 ? "s" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldDescription>
                  Title must be 10-80 characters. Description must be 20-500 characters.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit Proposal</Button>
          </Field>
        </FieldGroup>
      </form>

      <ConfirmCreateProposalDialog
        open={isDialogOpen}
        onOpenChange={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmCreate}
        onCancel={() => {
          setError(null);
          setPendingProposal(null);
        }}
        proposalTitle={pendingProposal?.title || ""}
      />

      <AlertDialog open={isAlertDialogOpen}>
        {isWaitingProposalCreation ? (
          <AlertDialogContent className="flex justify-center items-center p-16">
            <Spinner className="size-12 text-blue-600" />
          </AlertDialogContent>
        ) : (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{error ? "Error" : "Success"}</AlertDialogTitle>
              <AlertDialogDescription>
                {error ? error : "Your proposal has been created successfully."}
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

export default CreateProposalField;

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
import { useTxStatusState } from "@/hooks/useTxStatus";
import emitter from "@/lib/eventBus";

interface CreateProposalFieldProps {
  onSuccess: () => void;
}

const CreateProposalField = ({ onSuccess }: CreateProposalFieldProps) => {
  const { address: walletAddress } = useAccount();
  const { show, showError } = useTxStatusState();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [pendingProposal, setPendingProposal] = React.useState<CreateProposalParams | null>(null);
  const [category, setCategory] = React.useState<string>("");
  const [duration, setDuration] = React.useState<string>("");

  const handleConfirmCreate = async () => {
    try {
      if (!walletAddress) {
        showError("Wallet address not found. Please log in again.");
        return;
      }

      if (!pendingProposal) {
        showError("Proposal data is missing.");
        return;
      }

      // Show non-blocking popup
      show("Creating proposal on blockchain...");

      onSuccess();

      setPendingProposal(null);

      const result = await createProposal(pendingProposal);

      if (result.success) {
        show("Proposal created successfully! ✓");
        emitter.emit("proposalUpdated");
      } else {
        showError(result.error || "Failed to create proposal");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      showError(
        error instanceof Error ? error.message : "An error occurred while creating the proposal."
      );
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
            showError("Wallet address not found. Please log in again.");
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
                  minLength={5}
                  maxLength={60}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="proposal-description">Description</FieldLabel>
                <Textarea
                  id="proposal-description"
                  placeholder="Describe your proposal in detail"
                  required
                  minLength={10}
                  maxLength={250}
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
                  Title must be 5-60 characters. Description must be 10-250 characters.
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
          setPendingProposal(null);
        }}
        proposalTitle={pendingProposal?.title || ""}
      />
    </div>
  );
};

export default CreateProposalField;

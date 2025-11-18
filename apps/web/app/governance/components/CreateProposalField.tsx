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
  const { show, showError, hide } = useTxStatusState();
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
        setTimeout(() => {
          hide();
        }, 3000);
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
    <div className="w-full max-w-md mx-auto">
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
        className="space-y-4 sm:space-y-6"
      >
        <FieldGroup>
          <FieldSet>
            <FieldGroup className="space-y-4 sm:space-y-6">
              <Field>
                <FieldLabel htmlFor="proposal-title" className="text-sm sm:text-base">
                  Proposal Title
                </FieldLabel>
                <Input
                  id="proposal-title"
                  placeholder="Enter proposal title"
                  required
                  minLength={5}
                  maxLength={60}
                  className="text-sm sm:text-base"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="proposal-description" className="text-sm sm:text-base">
                  Description
                </FieldLabel>
                <Textarea
                  id="proposal-description"
                  placeholder="Describe your proposal in detail"
                  required
                  minLength={10}
                  maxLength={250}
                  rows={4}
                  className="text-sm sm:text-base resize-none"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="proposal-category" className="text-sm sm:text-base">
                    Category
                  </FieldLabel>
                  <Select name="category" required value={category} onValueChange={setCategory}>
                    <SelectTrigger id="proposal-category" className="text-sm sm:text-base">
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
                  <FieldLabel htmlFor="proposal-duration" className="text-sm sm:text-base">
                    Duration
                  </FieldLabel>
                  <Select name="duration" required value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="proposal-duration" className="text-sm sm:text-base">
                      <SelectValue placeholder="Select duration" />
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
              </div>

              <Field>
                <FieldDescription className="text-xs sm:text-sm text-gray-600">
                  Title: 5-60 characters. Description: 10-250 characters.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="pt-4 sm:pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base font-medium"
              size="lg"
            >
              Submit Proposal
            </Button>
          </div>
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

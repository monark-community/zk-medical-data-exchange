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
import { Gavel } from "lucide-react";
import CreateProposalField from "@/app/governance/components/CreateProposalField";
import { useTxStatusState } from "@/hooks/useTxStatus";

const CreateProposalDialog = () => {
  const [open, setOpen] = React.useState(false);
  const { isVisible: isTxProcessing } = useTxStatusState();
  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-blue-600 to-teal-600"
          size="lg"
          disabled={isTxProcessing}
        >
          <Gavel className="h-5 w-5 mr-2" />
          Create New Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Submit a new governance proposal to improve the Cura platform
          </DialogDescription>
        </DialogHeader>
        <CreateProposalField onSuccess={handleSuccess} />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button className="bg-red-600 hover:bg-red-700">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProposalDialog;

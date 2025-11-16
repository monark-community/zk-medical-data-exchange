"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import React from "react";

import { Spinner } from "@/components/ui//spinner";

const CustomAlert = ({
  isAlertDialogOpen,
  isWaitingForAction,
  error,
  successMessage,
  handleAlertClose,
}: {
  isAlertDialogOpen: boolean;
  isWaitingForAction: boolean;
  error?: string | null;
  successMessage?: string | null;
  handleAlertClose: () => void;
}) => {
  return (
    <AlertDialog open={isAlertDialogOpen}>
      {isWaitingForAction ? (
        <AlertDialogContent className="flex justify-center items-center p-16 ">
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle>Processing</AlertDialogTitle>
            <AlertDialogDescription>Please wait while the operation completes.</AlertDialogDescription>
          </AlertDialogHeader>
          <Spinner className="size-12 text-blue-600" />
        </AlertDialogContent>
      ) : (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="">{error ? "Error" : "Success"}</AlertDialogTitle>
            <AlertDialogDescription>{error ? error : successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAlertClose}>Ok</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
};

export default CustomAlert;

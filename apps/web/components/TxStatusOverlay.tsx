"use client";

import React from "react";
import { XCircle, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTxStatusState } from "@/hooks/useTxStatus";
import { Spinner } from "@/components/ui/spinner";
// Popup component to show blockchain transaction status
export const TxStatusOverlay: React.FC = () => {
  const { message, error, isVisible, hide } = useTxStatusState();
  // Don't render popup if not visible
  if (!isVisible) {
    return null;
  }

  const isError = !!error;
  const displayText = error || message;

  const isSuccess =
    !isError &&
    message &&
    (message.toLowerCase().includes("success") ||
      message.includes("✓") ||
      message.includes("✔") ||
      message.toLowerCase().includes("completed"));

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border-2 p-4 shadow-lg transition-all duration-300 ease-in-out backdrop-blur-sm max-w-md",
        isError
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          : isSuccess
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {isError ? (
          <XCircle className="h-5 w-5 text-red-600" />
        ) : isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Spinner className="h-5 w-5 text-blue-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium",
            isError
              ? "text-red-900 dark:text-red-100"
              : isSuccess
              ? "text-green-900 dark:text-green-100"
              : "text-blue-900 dark:text-blue-100"
          )}
        >
          {displayText}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={hide}
        className={cn(
          "flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
          isError
            ? "text-red-900 dark:text-red-100"
            : isSuccess
            ? "text-green-900 dark:text-green-100"
            : "text-blue-900 dark:text-blue-100"
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TxStatusOverlay;

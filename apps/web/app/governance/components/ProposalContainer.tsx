import { BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ProposalContainerProps {
  isLoading: boolean;
  error: string | null;
  proposals: any[];
  onRetry: () => void;
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  children: React.ReactNode;
}

export default function ProposalContainer({
  isLoading,
  error,
  proposals,
  onRetry,
  emptyState,
  children,
}: ProposalContainerProps) {
  return (
    <div id="proposal-container" className="px-6 pb-6">
      <div className="h-full max-h-[50vh] overflow-y-auto  rounded-lg ">
        {error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error loading proposals</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div
            className="flex flex-col items-center justify-center p-12 h-full text-center"
            role="status"
            aria-live="polite"
          >
            <Spinner className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading proposals...</h3>
            <p className="text-gray-600">Fetching governance proposals</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {emptyState?.title || "No proposals available"}
            </h3>
            <p className="text-gray-600 mb-6">
              {emptyState?.description || "There are no proposals to display."}
            </p>
            {emptyState?.action}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

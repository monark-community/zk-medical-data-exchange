import { BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface StudiesContainerProps {
  isLoading: boolean;
  error: string | null;
  studies: any[];
  onRetry: () => void;
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  children: React.ReactNode;
}

export default function StudiesContainer({
  isLoading,
  error,
  studies,
  onRetry,
  emptyState,
  children,
}: StudiesContainerProps) {
  return (
    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
      <div className="max-h-[500px] sm:max-h-[360px] overflow-y-auto border rounded-lg bg-gray-50/50">
        {error ? (
          <div className="p-8 sm:p-12 text-center">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-red-900 mb-2">
              Error loading studies
            </h3>
            <p className="text-sm sm:text-base text-red-600 mb-4 sm:mb-6">{error}</p>
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-8 sm:p-12 text-center">
            <Spinner className="size-10 sm:size-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Loading studies...
            </h3>
            <p className="text-sm sm:text-base text-gray-600">Fetching medical research studies</p>
          </div>
        ) : studies.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {emptyState?.title || "No studies available"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {emptyState?.description || "There are no studies to display."}
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

/**
 * AuditPagination Component
 * Traditional pagination component for audit records
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationInfo } from "@/services/api/auditService";

interface AuditPaginationProps {
  pagination: PaginationInfo;
  // eslint-disable-next-line no-unused-vars
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

const AuditPagination: React.FC<AuditPaginationProps> = ({
  pagination,
  onPageChange,
  isLoading = false,
  className = "",
}) => {
  const { offset, limit, total } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const showingFrom = offset + 1;
  const showingTo = Math.min(offset + limit, total);

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const getVisiblePages = () => {
    const maxVisible = 3;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    const adjustedStart = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col space-y-3 sm:space-y-4 ${className}`}>
      {/* Results Info */}
      <div className="flex items-center justify-center text-xs sm:text-sm text-gray-600">
        <div>
          Showing {showingFrom}-{showingTo} of {total} results
        </div>
      </div>

      {/* Traditional Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center space-x-1 px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* First Page */}
            {visiblePages[0] > 1 && (
              <>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={isLoading}
                  className="min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3"
                >
                  1
                </Button>
                {visiblePages[0] > 2 && <span className="text-gray-500 px-1">...</span>}
              </>
            )}

            {/* Visible Page Numbers */}
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={isLoading}
                className="min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3"
              >
                {page}
              </Button>
            ))}

            {/* Last Page */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="text-gray-500 px-1">...</span>
                )}
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={isLoading}
                  className="min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3"
                >
                  {totalPages}
                </Button>
              </>
            )}

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center space-x-1 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Page Information */}
      {totalPages > 1 && (
        <div className="flex justify-center text-xs sm:text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

export default AuditPagination;

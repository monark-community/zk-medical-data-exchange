/**
 * AuditSection Component
 * Main component for displaying user audit logs with filtering and pagination
 */

"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, AlertCircle, Activity, Database } from "lucide-react";
import { useAccount } from "wagmi";
import { useAudit } from "@/hooks/useAudit";
import { AuditRecord } from "@/services/api/auditService";
import AuditTable from "./AuditTable";
import AuditPagination from "./AuditPagination";
import AuditRecordDialog from "./AuditRecordDialog";
import DashboardSectionHeader from "@/app/dashboard/components/shared/DashboardSectionHeader";

interface AuditSectionProps {
  className?: string;
}

const AuditSection: React.FC<AuditSectionProps> = ({ className = "" }) => {
  const { address: userAddress } = useAccount();
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    records,
    pagination,
    isLoading,
    hasDataLoaded,
    error,
    goToPage,
    refresh,
    loadInitialData,
    canRefresh,
    refreshCooldownSeconds,
  } = useAudit({
    userAddress,
    autoFetch: false, // Disable auto-fetch for manual control
  });

  const handlePageChange = useCallback(
    (page: number) => {
      if (pagination) {
        goToPage(page);
      }
    },
    [goToPage, pagination]
  );

  const handleRecordClick = useCallback((record: AuditRecord) => {
    setSelectedRecord(record);
    setDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleLoadData = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (!userAddress) {
    return (
      <div className={`${className}`}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="flex flex-col items-center space-y-6 py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Wallet Connection Required
              </h3>
              <p className="text-gray-600 max-w-md">
                Connect your wallet to access your privacy audit logs and activity history
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <DashboardSectionHeader
        icon={<Shield className="h-8 w-8 text-white" />}
        title="Privacy & Audit Center"
        description="Monitor your data activity and privacy trail on the blockchain"
        action={
          <Button
            onClick={handleRefresh}
            disabled={isLoading || !canRefresh}
            variant="outline"
            size="sm"
            className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            <span>
              {refreshCooldownSeconds > 0 ? `Wait ${refreshCooldownSeconds}s` : "Refresh"}
            </span>
          </Button>
        }
      />

      {/* Initial Load State - Show when no data has been loaded */}
      {!hasDataLoaded && !isLoading && !error && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full">
                  <Database className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Load Your Privacy Audit Trail
                </h3>
                <p className="text-gray-600 max-w-md">
                  Fetch your complete activity history and audit trail directly from the blockchain.
                  This includes all your data interactions and privacy events.
                </p>
              </div>
              <Button
                onClick={handleLoadData}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Database className="h-5 w-5 mr-2" />
                <span>Load Audit Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-l-red-500">
          <CardContent className="py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800">Unable to Load Audit Data</h3>
                <p className="text-red-700 mt-1 text-sm">{error}</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={!canRefresh}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                {refreshCooldownSeconds > 0 ? `Wait ${refreshCooldownSeconds}s` : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Table - Only show when data has been loaded */}
      {hasDataLoaded && records.length > 0 && (
        <Card className="border-0 shadow-xl overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 border-b border-slate-200/50 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2 sm:p-3 rounded-xl shadow-lg">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium text-sm sm:text-base">
                    Your latest privacy and data interactions
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 px-2 sm:px-3 py-1 sm:py-1.5 font-semibold shadow-sm text-xs sm:text-sm"
                  >
                    <Database className="h-3 w-3 mr-1 sm:mr-1.5" />
                    {records.length} records
                  </Badge>
                  {pagination && (
                    <Badge
                      variant="outline"
                      className="text-slate-600 border-slate-300/50 bg-white/50 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 font-medium shadow-sm text-xs sm:text-sm"
                    >
                      Page {Math.floor(pagination.offset / 20) + 1} of{" "}
                      {Math.ceil(pagination.total / 20)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <AuditTable records={records} isLoading={isLoading} onRecordClick={handleRecordClick} />

          {/* Pagination */}
          {pagination && (
            <div className="bg-gradient-to-br from-slate-50/80 via-blue-50/20 to-indigo-50/30 border-t border-slate-200/50 px-4 sm:px-8 py-4 sm:py-6">
              <AuditPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </Card>
      )}

      {/* Empty State - Show when data has been loaded but no records exist */}
      {hasDataLoaded && records.length === 0 && !isLoading && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-gray-500 rounded-full blur-lg opacity-20"></div>
                <div className="relative bg-gradient-to-r from-slate-400 to-gray-500 p-6 rounded-full">
                  <Activity className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">
                  No Audit Logs Yet
                </h3>
                <p className="text-gray-600 max-w-md">
                  Your activity history is empty. Start interacting with studies, uploading data, or
                  managing your privacy settings to see audit logs here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Record Dialog */}
      <AuditRecordDialog record={selectedRecord} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default AuditSection;

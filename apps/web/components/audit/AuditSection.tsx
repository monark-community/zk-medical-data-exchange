/**
 * AuditSection Component
 * Main component for displaying user audit logs with filtering and pagination
 */

"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useAudit } from "@/hooks/useAudit";
import { AuditRecord, getProfileName } from "@/services/api/auditService";
import AuditTable from "./AuditTable";
import AuditPagination from "./AuditPagination";

interface AuditSectionProps {
  className?: string;
}

const AuditSection: React.FC<AuditSectionProps> = ({ className = "" }) => {
  const { address: userAddress } = useAccount();
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const {
    records,
    pagination,
    isLoading,
    hasDataLoaded,
    error,
    goToPage,
    refresh,
    loadInitialData,
    currentProfile,
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
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleLoadData = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (!userAddress) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Wallet Not Connected</h3>
            <p className="text-gray-600">Please connect your wallet to view audit logs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Activity & Audit Logs</h2>
            <p className="text-sm text-gray-600">View your Data account activity and audit trail</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Profile:</span>
          </div>
          <Badge variant="outline" className="text-sm">
            {getProfileName(currentProfile)}
          </Badge>
        </div>
      </Card>

      {/* Initial Load State - Show when no data has been loaded */}
      {!hasDataLoaded && !isLoading && !error && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Load Your Audit Logs</h3>
              <p className="text-gray-600 mt-1">
                Click the button below to fetch your activity and audit trail from the blockchain.
              </p>
            </div>
            <Button onClick={handleLoadData} className="flex items-center space-x-2" size="lg">
              <Shield className="h-4 w-4" />
              <span>Load Audit Data</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Audit Logs</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Audit Table - Only show when data has been loaded */}
      {hasDataLoaded && records.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Showing:</span>
                <Badge variant="secondary">{records.length} records</Badge>
              </div>
            </div>
          </div>

          <AuditTable records={records} isLoading={isLoading} onRecordClick={handleRecordClick} />

          {/* Pagination */}
          {pagination && (
            <div className="p-4 border-t">
              <AuditPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </Card>
      )}

      {/* Record Detail Modal/Drawer (Future Enhancement) */}
      {selectedRecord && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-800">Selected Record</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)}>
              ✕
            </Button>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <div>
              <span className="font-medium">ID:</span> {selectedRecord.id}
            </div>
            <div>
              <span className="font-medium">Action:</span> {selectedRecord.action}
            </div>
            <div>
              <span className="font-medium">Resource:</span> {selectedRecord.resource}
            </div>
            <div>
              <span className="font-medium">User:</span> {selectedRecord.user}
            </div>
            {selectedRecord.metadata && (
              <div>
                <span className="font-medium">Metadata:</span>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(JSON.parse(selectedRecord.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuditSection;

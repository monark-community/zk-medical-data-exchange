/**
 * AuditTable Component
 * Displays audit records in a formatted table with action status, profile badges, and timestamps
 */

"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AuditRecord,
  UserProfile,
  getProfileName,
  getActionTypeName,
  formatAuditTimestamp,
  getSuccessStatusClass,
  getProfileClass,
} from "@/services/api/auditService";
import { CheckCircle, XCircle, Eye, Info } from "lucide-react";

interface AuditTableProps {
  records: AuditRecord[];
  isLoading?: boolean;
  onRecordClick?: (record: AuditRecord) => void;
  className?: string;
}

const AuditTable: React.FC<AuditTableProps> = ({
  records,
  isLoading = false,
  onRecordClick,
  className = "",
}) => {
  const handleRowClick = (record: AuditRecord) => {
    onRecordClick?.(record);
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Info className="h-8 w-8 text-gray-400" />
          <p className="text-gray-500">No audit records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Profile</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              className={`${onRecordClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={() => handleRowClick(record)}
            >
              {/* Status Column */}
              <TableCell>
                <div className="flex items-center space-x-2">
                  {record.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${getSuccessStatusClass(record.success)}`}
                  >
                    {record.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              </TableCell>

              {/* Action Column */}
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-sm">{record.action}</div>
                  <div className="text-xs text-gray-500">
                    {getActionTypeName(record.actionType)}
                  </div>
                </div>
              </TableCell>

              {/* Profile Column */}
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs ${getProfileClass(record.userProfile)}`}
                >
                  {getProfileName(record.userProfile)}
                </Badge>
              </TableCell>

              {/* Resource Column */}
              <TableCell>
                <div className="max-w-32 truncate text-sm" title={record.resource}>
                  {record.resource}
                </div>
              </TableCell>

              {/* Timestamp Column */}
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatAuditTimestamp(record.timestamp)}
                </div>
              </TableCell>

              {/* Details Column */}
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">ID: {record.id}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuditTable;

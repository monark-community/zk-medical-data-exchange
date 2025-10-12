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
  getProfileName,
  getActionTypeName,
  formatAuditTimestamp,
  getProfileClass,
} from "@/services/api/auditService";
import { CheckCircle, XCircle, Eye, Info } from "lucide-react";

interface AuditTableProps {
  records: AuditRecord[];
  isLoading?: boolean;
  // eslint-disable-next-line no-unused-vars
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
      <div className={`space-y-4 p-6 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl shadow-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur-sm opacity-20"></div>
            <div className="relative bg-gradient-to-r from-slate-400 to-slate-500 p-4 rounded-full">
              <Info className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 font-semibold text-lg">No audit records found</p>
            <p className="text-slate-500 text-sm">
              Your activity will appear here once you start interacting with the platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/50 backdrop-blur-sm ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-blue-50/30 hover:bg-slate-50/80">
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Status
            </TableHead>
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Action
            </TableHead>
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Profile
            </TableHead>
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Resource
            </TableHead>
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Timestamp
            </TableHead>
            <TableHead className="text-slate-700 font-semibold text-sm tracking-wide">
              Details
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow
              key={record.id}
              className={`
                ${onRecordClick ? "cursor-pointer" : ""} 
                border-b border-slate-200/30 
                hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 
                transition-all duration-200 ease-in-out
                group
                ${index % 2 === 0 ? "bg-white/30" : "bg-slate-50/20"}
              `}
              onClick={() => handleRowClick(record)}
            >
              {/* Status Column */}
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {record.success ? (
                      <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-1.5 rounded-full">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-red-100 to-rose-100 p-1.5 rounded-full">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`
                      text-xs font-semibold px-2.5 py-1 shadow-sm
                      ${
                        record.success
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/50"
                          : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50"
                      }
                    `}
                  >
                    {record.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              </TableCell>

              {/* Action Column */}
              <TableCell className="py-4 px-6">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-800 text-sm group-hover:text-slate-900 transition-colors">
                    {record.action}
                  </div>
                  <div className="text-xs text-slate-500 font-medium bg-slate-100/50 px-2 py-0.5 rounded-md inline-block">
                    {getActionTypeName(record.actionType)}
                  </div>
                </div>
              </TableCell>

              {/* Profile Column */}
              <TableCell className="py-4 px-6">
                <Badge
                  variant="outline"
                  className={`
                    text-xs font-semibold px-3 py-1.5 shadow-sm rounded-lg
                    ${getProfileClass(record.userProfile)}
                    bg-white/50 backdrop-blur-sm border-opacity-50
                  `}
                >
                  {getProfileName(record.userProfile)}
                </Badge>
              </TableCell>

              {/* Resource Column */}
              <TableCell className="py-4 px-6">
                <div className="max-w-32">
                  <div
                    className="truncate text-sm font-medium text-slate-700 bg-slate-100/30 px-3 py-1.5 rounded-lg border border-slate-200/50"
                    title={record.resource}
                  >
                    {record.resource}
                  </div>
                </div>
              </TableCell>

              {/* Timestamp Column */}
              <TableCell className="py-4 px-6">
                <div className="text-sm text-slate-600 font-medium bg-white/30 px-3 py-1.5 rounded-lg border border-slate-200/30">
                  {formatAuditTimestamp(record.timestamp)}
                </div>
              </TableCell>

              {/* Details Column */}
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-1.5 rounded-full group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                    <Eye className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono bg-slate-100/50 px-2 py-1 rounded border border-slate-200/50">
                    #{record.id}
                  </span>
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

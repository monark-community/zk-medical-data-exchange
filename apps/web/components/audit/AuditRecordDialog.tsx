/**
 * AuditRecordDialog Component
 * Modal dialog to display detailed audit record metadata
 */

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Clock, Hash, Database, User, FileText } from "lucide-react";
import {
  AuditRecord,
  getProfileName,
  getActionTypeName,
  formatAuditTimestamp,
  getProfileClass,
} from "@/services/api/auditService";

interface AuditRecordDialogProps {
  record: AuditRecord | null;
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
}

const AuditRecordDialog: React.FC<AuditRecordDialogProps> = ({ record, open, onOpenChange }) => {
  if (!record) return null;

  const formatMetadata = (metadata: string) => {
    try {
      const parsed = JSON.parse(metadata);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return metadata;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-6xl !w-[85vw] max-h-[80vh] overflow-y-auto"
        style={{ maxWidth: "min(1152px, 85vw)", width: "85vw" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-full">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <span>Audit Record Details</span>
            <Badge variant="outline" className="text-xs font-mono bg-slate-100 text-slate-600">
              #{record.id}
            </Badge>
          </DialogTitle>
          <DialogDescription>Complete audit trail information for this action</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status Section */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-4 rounded-xl border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {record.success ? (
                    <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-red-100 to-rose-100 p-2 rounded-full">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">
                      {record.success ? "Operation Successful" : "Operation Failed"}
                    </div>
                    <div className="text-sm text-slate-600">
                      Action completed {record.success ? "successfully" : "with errors"}
                    </div>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`
                  font-semibold px-3 py-1
                  ${
                    record.success
                      ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200"
                      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200"
                  }
                `}
              >
                {record.success ? "SUCCESS" : "FAILED"}
              </Badge>
            </div>
          </div>

          {/* Action Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Action Details</span>
              </h3>

              <div className="space-y-3 bg-white/50 p-4 rounded-lg border border-slate-200/50">
                <div>
                  <label className="text-sm font-medium text-slate-600">Action</label>
                  <div className="text-slate-800 font-semibold mt-1">{record.action}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Action Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-slate-100/50 text-slate-700">
                      {getActionTypeName(record.actionType)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Resource</label>
                  <div className="text-slate-800 font-mono text-sm bg-slate-100/50 px-3 py-2 rounded mt-1 break-all">
                    {record.resource}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span>User Information</span>
              </h3>

              <div className="space-y-3 bg-white/50 p-4 rounded-lg border border-slate-200/50">
                <div>
                  <label className="text-sm font-medium text-slate-600">User Address</label>
                  <div className="text-slate-800 font-mono text-sm bg-slate-100/50 px-3 py-2 rounded mt-1 break-all">
                    {record.user}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Profile</label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`${getProfileClass(record.userProfile)} bg-white/50`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {getProfileName(record.userProfile)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp and Hash */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-white/50 p-4 rounded-lg border border-slate-200/50">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-medium text-slate-600">Timestamp</label>
              </div>
              <div className="text-slate-800 font-medium">
                {formatAuditTimestamp(record.timestamp)}
              </div>
              <div className="text-xs text-slate-500 font-mono">Unix: {record.timestamp}</div>
            </div>

            <div className="space-y-3 bg-white/50 p-4 rounded-lg border border-slate-200/50">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-purple-600" />
                <label className="text-sm font-medium text-slate-600">Data Hash</label>
              </div>
              <div className="text-slate-800 font-mono text-sm bg-slate-100/50 px-3 py-2 rounded break-all">
                {record.dataHash}
              </div>
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* Metadata Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>Metadata</span>
            </h3>

            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {formatMetadata(record.metadata)}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditRecordDialog;

"use client";

import React from "react";
import { BinConfiguration, BinType, DataBin } from "@zk-medical/shared";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Shield, AlertCircle } from "lucide-react";

interface BinPreviewProps {
  binConfig: BinConfiguration | null;
  isGenerating?: boolean;
}

export function BinPreview({ binConfig, isGenerating }: BinPreviewProps) {
  if (isGenerating) {
    return (
      <Card className="p-6 border-2 border-blue-200 bg-blue-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">Generating data aggregation bins...</span>
        </div>
      </Card>
    );
  }

  if (!binConfig || binConfig.bins.length === 0) {
    return (
      <Card className="p-6 border-2 border-gray-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-600 font-medium">No data aggregation bins configured</p>
            <p className="text-sm text-gray-500 mt-1">
              Enable at least one eligibility criterion to generate aggregation bins
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const binsByField = binConfig.bins.reduce((acc, bin) => {
    if (!acc[bin.criteriaField]) {
      acc[bin.criteriaField] = [];
    }
    acc[bin.criteriaField].push(bin);
    return {};
  }, {} as Record<string, DataBin[]>);

  const fieldCount = Object.keys(binsByField).length;
  const totalBins = binConfig.bins.length;

  return (
    <div className="space-y-4">
      <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Data Aggregation Configured
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your study will collect privacy-preserving aggregated statistics across{" "}
                <span className="font-semibold text-green-700">{totalBins} bins</span> from{" "}
                <span className="font-semibold text-green-700">{fieldCount} criteria fields</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">Privacy Protected</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalBins}</div>
            <div className="text-xs text-gray-600 mt-1">Total Bins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{fieldCount}</div>
            <div className="text-xs text-gray-600 mt-1">Data Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-xs text-gray-600 mt-1">K-Anonymity</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-2 border-blue-200 bg-blue-50">
        <div className="flex items-start space-x-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How Data Aggregation Works:</p>
            <ul className="space-y-1 text-blue-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Participants prove bin membership via <strong>zero-knowledge proofs</strong> (no
                  raw data revealed)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  You'll see aggregated counts only (e.g., "25 participants aged 30-40")
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Individual bin membership is <strong>private</strong> - not queryable by
                  researchers
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Bins with less than 5 participants will be hidden for <strong>k-anonymity</strong>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-2 border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
          Bin Configuration Preview
        </h4>

        <div className="space-y-6">
          {Object.entries(binsByField).map(([field, bins]) => (
            <div key={field} className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700 capitalize">
                  {field.replace(/([A-Z])/g, " $1").trim()}
                </h5>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {bins.length} bins
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {bins.map((bin, idx) => (
                  <div
                    key={bin.id}
                    className="p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {bin.type === BinType.RANGE ? "Range" : "Category"}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 leading-tight">
                          {bin.label}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">#{idx + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

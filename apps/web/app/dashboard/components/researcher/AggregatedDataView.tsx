"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getAggregatedData,
  AggregatedStudyData,
  AggregatedBinData,
} from "@/services/api/studyService";
import {
  BarChart3,
  Users,
  Download,
  Info,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { BINNABLE_FIELDS, CATEGORICAL_LABELS, REGION_LABELS } from "@zk-medical/shared";

interface AggregatedDataViewProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  studyId: number;
  studyTitle: string;
  creatorWallet: string;
}

interface ProcessedBinData extends AggregatedBinData {
  percentage: number;
  displayLabel: string;
}

export default function AggregatedDataView({
  open,
  onOpenChange,
  studyId,
  studyTitle,
  creatorWallet,
}: AggregatedDataViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AggregatedStudyData | null>(null);
  const [processedData, setProcessedData] = useState<Map<string, ProcessedBinData[]>>(new Map());

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, studyId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AGGREGATED_DATA] Fetching data for study:', studyId);
      const result = await getAggregatedData(studyId, creatorWallet);
      console.log('[AGGREGATED_DATA] Received data:', {
        totalParticipants: result.totalParticipants,
        binsCount: result.bins.length,
        uniqueFields: [...new Set(result.bins.map(b => b.criteriaField))],
        binsPreview: result.bins.slice(0, 3)
      });
      setData(result);
      processAggregatedData(result);
    } catch (err: any) {
      console.error("[AGGREGATED_DATA] Failed to fetch:", err);
      console.error("[AGGREGATED_DATA] Error response:", err.response?.data);
      setError(err.response?.data?.error || "Failed to load aggregated data");
    } finally {
      setLoading(false);
    }
  };

  const processAggregatedData = (aggregatedData: AggregatedStudyData) => {
    console.log('[AGGREGATED_DATA] Processing data:', {
      binsCount: aggregatedData.bins.length,
      totalParticipants: aggregatedData.totalParticipants
    });
    
    // Group bins by criteria field
    const grouped = new Map<string, ProcessedBinData[]>();

    aggregatedData.bins.forEach((bin) => {
      const percentage =
        aggregatedData.totalParticipants > 0
          ? (bin.count / aggregatedData.totalParticipants) * 100
          : 0;

      const displayLabel = generateDisplayLabel(bin);

      const processedBin: ProcessedBinData = {
        ...bin,
        percentage,
        displayLabel,
      };

      const existing = grouped.get(bin.criteriaField) || [];
      existing.push(processedBin);
      grouped.set(bin.criteriaField, existing);
    });
    
    console.log('[AGGREGATED_DATA] Grouped bins by field:', {
      fields: Array.from(grouped.keys()),
      fieldCounts: Array.from(grouped.entries()).map(([field, bins]) => ({ field, count: bins.length }))
    });

    // Sort bins within each field
    grouped.forEach((bins) => {
      bins.sort((a, b) => {
        if (a.binType === "RANGE" && a.minValue !== undefined && b.minValue !== undefined) {
          return a.minValue - b.minValue;
        }
        return 0;
      });
    });

    setProcessedData(grouped);
  };

  const generateDisplayLabel = (bin: AggregatedBinData): string => {
    if (bin.binType === "CATEGORICAL") {
      // Handle categorical bins
      if (bin.criteriaField === "region") {
        const bitmap = bin.categoriesBitmap || 0;
        const regions: string[] = [];
        for (let i = 1; i <= 6; i++) {
          if (bitmap & (1 << (i - 1))) {
            regions.push(REGION_LABELS[i] || `Region ${i}`);
          }
        }
        return regions.join(", ") || bin.label;
      }

      const labels = CATEGORICAL_LABELS[bin.criteriaField];
      if (labels) {
        const bitmap = bin.categoriesBitmap || 0;
        const categories: string[] = [];
        Object.keys(labels).forEach((key) => {
          const num = parseInt(key);
          if (bitmap & (1 << num)) {
            categories.push(labels[num]);
          }
        });
        return categories.join(", ") || bin.label;
      }

      return bin.label;
    } else {
      // Handle range bins
      const fieldMeta = Object.values(BINNABLE_FIELDS).find(
        (f) => f.field === bin.criteriaField
      );
      const unit = fieldMeta?.unit || "";
      const decimalPlaces = fieldMeta?.decimalPlaces || 0;

      if (bin.minValue !== undefined && bin.maxValue !== undefined) {
        const minFormatted = bin.minValue.toFixed(decimalPlaces);
        const maxFormatted = bin.maxValue.toFixed(decimalPlaces);
        const minSymbol = bin.includeMin ? "[" : "(";
        const maxSymbol = bin.includeMax ? "]" : ")";
        return `${minSymbol}${minFormatted} - ${maxFormatted}${maxSymbol} ${unit}`.trim();
      }

      return bin.label;
    }
  };

  const downloadCSV = () => {
    if (!data) return;

    const csvRows = [
      ["Criteria Field", "Bin Label", "Count", "Percentage"],
      ...data.bins.map((bin) => {
        const processed = processedData
          .get(bin.criteriaField)
          ?.find((b) => b.binId === bin.binId);
        return [
          bin.criteriaField,
          processed?.displayLabel || bin.label,
          bin.count.toString(),
          `${processed?.percentage.toFixed(2)}%`,
        ];
      }),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-${studyId}-aggregated-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFieldLabel = (field: string): string => {
    const meta = Object.values(BINNABLE_FIELDS).find((f) => f.field === field);
    return meta?.label || field;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Aggregated Study Results
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{studyTitle}</p>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-10 w-10 text-emerald-600 mb-4" />
            <p className="text-muted-foreground">Loading aggregated data from blockchain...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={fetchData} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Total Participants</p>
                    <p className="text-3xl font-bold text-emerald-900 mt-1">
                      {data.totalParticipants}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-emerald-600 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Data Fields</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">
                      {processedData.size}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-600 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Total Bins</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{data.bins.length}</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-purple-600 opacity-50" />
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Privacy-Preserving Aggregation</p>
                <p>
                  This data shows participant distribution across bins without revealing individual
                  data. Each participant&apos;s actual medical information remains encrypted and
                  private.
                </p>
              </div>
            </div>

            {/* Visualizations by Field */}
            <div className="space-y-6">
              {Array.from(processedData.entries()).map(([field, bins]) => (
                <div key={field} className="border rounded-lg p-6 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {getFieldLabel(field)}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({bins.length} bins)
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {bins.map((bin) => (
                      <div key={bin.binId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{bin.displayLabel}</span>
                          <span className="text-gray-600">
                            {bin.count} ({bin.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out flex items-center justify-end px-3"
                            style={{ width: `${Math.max(bin.percentage, 3)}%` }}
                          >
                            {bin.percentage > 10 && (
                              <span className="text-xs font-semibold text-white">
                                {bin.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Generated on {new Date(data.generatedAt).toLocaleString()}
              </p>
              <Button
                onClick={downloadCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

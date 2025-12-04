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
  Activity,
  Target,
  Percent,
} from "lucide-react";
import { BINNABLE_FIELDS, CATEGORICAL_LABELS, REGION_LABELS } from "@zk-medical/shared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

interface FieldStatistics {
  mean?: number;
  median?: number;
  stdDev?: number;
  q1?: number;
  q3?: number;
  min?: number;
  max?: number;
  mode?: string;
  totalCount: number;
}

const CHART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
];

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
  const [statistics, setStatistics] = useState<Map<string, FieldStatistics>>(new Map());

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, studyId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAggregatedData(studyId, creatorWallet);
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

  const calculateStatistics = (bins: ProcessedBinData[]): FieldStatistics => {
    const totalCount = bins.reduce((sum, bin) => sum + bin.count, 0);

    if (bins.length > 0 && bins[0].binType === "RANGE") {
      const values: number[] = [];
      bins.forEach((bin) => {
        if (bin.minValue !== undefined && bin.maxValue !== undefined) {
          const midpoint = (bin.minValue + bin.maxValue) / 2;
          for (let i = 0; i < bin.count; i++) {
            values.push(midpoint);
          }
        }
      });

      if (values.length === 0) {
        return { totalCount };
      }

      values.sort((a, b) => a - b);

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

      const midIndex = Math.floor(values.length / 2);
      const median =
        values.length % 2 === 0
          ? (values[midIndex - 1] + values[midIndex]) / 2
          : values[midIndex];

      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const q1Index = Math.floor(values.length * 0.25);
      const q3Index = Math.floor(values.length * 0.75);
      const q1 = values[q1Index];
      const q3 = values[q3Index];

      const min = bins[0].minValue;
      const max = bins[bins.length - 1].maxValue;

      return {
        mean,
        median,
        stdDev,
        q1,
        q3,
        min,
        max,
        totalCount,
      };
    } else {
      const maxBin = bins.reduce((max, bin) => (bin.count > max.count ? bin : max), bins[0]);
      return {
        mode: maxBin.displayLabel,
        totalCount,
      };
    }
  };

  const processAggregatedData = (aggregatedData: AggregatedStudyData) => {
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
    
    grouped.forEach((bins) => {
      bins.sort((a, b) => {
        if (a.binType === "RANGE" && a.minValue !== undefined && b.minValue !== undefined) {
          return a.minValue - b.minValue;
        }
        return 0;
      });
    });

    setProcessedData(grouped);

    const stats = new Map<string, FieldStatistics>();
    grouped.forEach((bins, field) => {
      stats.set(field, calculateStatistics(bins));
    });
    setStatistics(stats);
  };

  const generateDisplayLabel = (bin: AggregatedBinData): string => {
    if (bin.binType === "CATEGORICAL") {
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
      <DialogContent className="!max-w-[80vw] !w-[80vw] max-h-[95vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
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

            <div className="space-y-6">
              {Array.from(processedData.entries()).map(([field, bins]) => {
                const stats = statistics.get(field);
                const isRange = bins.length > 0 && bins[0].binType === "RANGE";
                const fieldMeta = Object.values(BINNABLE_FIELDS).find((f) => f.field === field);
                const unit = fieldMeta?.unit || "";
                const decimalPlaces = fieldMeta?.decimalPlaces || 0;

                const chartData = bins.map((bin, idx) => ({
                  name: bin.displayLabel.length > 20 
                    ? `${bin.displayLabel.substring(0, 17)}...` 
                    : bin.displayLabel,
                  fullName: bin.displayLabel,
                  count: bin.count,
                  percentage: bin.percentage,
                  fill: CHART_COLORS[idx % CHART_COLORS.length],
                }));

                return (
                  <div key={field} className="border rounded-lg p-6 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      {getFieldLabel(field)}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({bins.length} bins, {stats?.totalCount || 0} total)
                      </span>
                    </h3>

                    {isRange && stats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                        {stats.mean !== undefined && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="h-4 w-4 text-emerald-600" />
                              <p className="text-xs font-medium text-emerald-700">Mean</p>
                            </div>
                            <p className="text-lg font-bold text-emerald-900">
                              {stats.mean.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.median !== undefined && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-medium text-blue-700">Median</p>
                            </div>
                            <p className="text-lg font-bold text-blue-900">
                              {stats.median.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.stdDev !== undefined && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-purple-600" />
                              <p className="text-xs font-medium text-purple-700">Std Dev</p>
                            </div>
                            <p className="text-lg font-bold text-purple-900">
                              {stats.stdDev.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.min !== undefined && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-amber-600 rotate-180" />
                              <p className="text-xs font-medium text-amber-700">Min</p>
                            </div>
                            <p className="text-lg font-bold text-amber-900">
                              {stats.min.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.max !== undefined && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-red-600" />
                              <p className="text-xs font-medium text-red-700">Max</p>
                            </div>
                            <p className="text-lg font-bold text-red-900">
                              {stats.max.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.q1 !== undefined && (
                          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Percent className="h-4 w-4 text-cyan-600" />
                              <p className="text-xs font-medium text-cyan-700">Q1 (25%)</p>
                            </div>
                            <p className="text-lg font-bold text-cyan-900">
                              {stats.q1.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                        {stats.q3 !== undefined && (
                          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Percent className="h-4 w-4 text-pink-600" />
                              <p className="text-xs font-medium text-pink-700">Q3 (75%)</p>
                            </div>
                            <p className="text-lg font-bold text-pink-900">
                              {stats.q3.toFixed(decimalPlaces)} {unit}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!isRange && stats?.mode && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium text-emerald-700">Most Common</p>
                            <p className="text-lg font-bold text-emerald-900">{stats.mode}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribution Chart</h4>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 80 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                height={90}
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis 
                                label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                                tick={{ fontSize: 11 }}
                              />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                        <p className="font-semibold text-gray-900 mb-1">{data.fullName}</p>
                                        <p className="text-sm text-gray-700">Count: {data.count}</p>
                                        <p className="text-sm text-gray-700">
                                          Percentage: {data.percentage.toFixed(1)}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {bins.length <= 8 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Percentage Breakdown</h4>
                            <ResponsiveContainer width="100%" height={350}>
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="45%"
                                  labelLine={false}
                                  label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                                  outerRadius={110}
                                  fill="#8884d8"
                                  dataKey="count"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                          <p className="font-semibold text-gray-900 mb-1">{data.fullName}</p>
                                          <p className="text-sm text-gray-700">Count: {data.count}</p>
                                          <p className="text-sm text-gray-700">
                                            Percentage: {data.percentage.toFixed(1)}%
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={60}
                                  wrapperStyle={{ fontSize: '12px' }}
                                  formatter={(value, entry: any) => {
                                    const label = entry.payload.fullName;
                                    return label.length > 25 ? `${label.substring(0, 22)}...` : label;
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Breakdown</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3 border-b">Bin</th>
                                  <th className="text-right text-xs font-semibold text-gray-700 px-4 py-3 border-b">Count</th>
                                  <th className="text-right text-xs font-semibold text-gray-700 px-4 py-3 border-b">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bins.map((bin, idx) => (
                                  <tr key={bin.binId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 border-b border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                        />
                                        <span className="text-sm text-gray-700">{bin.displayLabel}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-700 border-b border-gray-100 font-medium">
                                      {bin.count}
                                    </td>
                                    <td className="px-4 py-3 text-right border-b border-gray-100">
                                      <span className="text-sm font-semibold text-emerald-600">
                                        {bin.percentage.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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

/**
 * Study Results Dialog
 * 
 * Comprehensive dialog for displaying aggregated study results with:
 * - Privacy metadata and guarantees
 * - Demographics visualizations
 * - Health metrics charts
 * - Lifestyle and conditions data
 * - Bin definitions for transparency
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DistributionBarChart,
  DistributionPieChart,
  StatCard,
  COLORS,
} from '@/components/charts/DistributionCharts';
import {
  fetchStudyAggregatedResults,
  triggerStudyAggregation,
  type StudyAggregatedResults,
} from '@/services/api/studyResultsService';
import {
  ShieldCheck,
  Users,
  Activity,
  AlertCircle,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface StudyResultsDialogProps {
  studyId: number;
  studyAddress: string;
  walletAddress: string;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
}

export const StudyResultsDialog: React.FC<StudyResultsDialogProps> = ({
  studyId,
  studyAddress,
  walletAddress,
  open,
  onOpenChange,
}) => {
  const [results, setResults] = useState<StudyAggregatedResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAggregation, setNeedsAggregation] = useState(false);

  useEffect(() => {
    if (open && studyId && walletAddress) {
      loadResults();
    }
  }, [open, studyId, walletAddress]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    setNeedsAggregation(false);

    try {
      const data = await fetchStudyAggregatedResults(studyId, walletAddress);
      setResults(data);
    } catch (err: any) {
      console.error('Failed to load results:', err);
      
      if (err.message?.includes('aggregation')) {
        setNeedsAggregation(true);
        setError('Study data has not been aggregated yet. Click "Aggregate Data" to generate results.');
      } else {
        setError(err.message || 'Failed to load study results');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAggregateData = async () => {
    setAggregating(true);
    setError(null);

    try {
      await triggerStudyAggregation(studyId, studyAddress);
      
      // Wait a bit for aggregation to complete, then reload
      setTimeout(async () => {
        await loadResults();
        setAggregating(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to aggregate data:', err);
      setError(err.message || 'Failed to aggregate study data');
      setAggregating(false);
    }
  };

  const handleDownloadResults = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-${studyId}-results-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Transform data for charts
  const transformDistribution = (distribution: Record<string, number>) => {
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading study results...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || needsAggregation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Study Results</DialogTitle>
            <DialogDescription>
              Aggregated study data with zero-knowledge privacy
            </DialogDescription>
          </DialogHeader>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          {needsAggregation && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleAggregateData}
                disabled={aggregating}
                size="lg"
              >
                {aggregating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggregating Data...
                  </>
                ) : (
                  'Aggregate Data Now'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (!results) {
    return null;
  }

  const { aggregatedData, binDefinitions } = results;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{results.studyTitle}</DialogTitle>
              <DialogDescription className="mt-1">
                {results.studyDescription}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadResults}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Privacy Metadata */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <StatCard
              label="Total Participants"
              value={results.participantCount}
              subtext={`${results.activeConsentCount} with active consent`}
              icon={<Users className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              label="k-Anonymity"
              value={results.meetsKAnonymity ? 'Met' : 'Not Met'}
              subtext={`Minimum 5 required`}
              icon={
                results.meetsKAnonymity ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )
              }
              color={results.meetsKAnonymity ? 'green' : 'orange'}
            />
            <StatCard
              label="Aggregation Method"
              value="Zero-Knowledge"
              subtext={results.aggregationMethod}
              icon={<ShieldCheck className="h-6 w-6" />}
              color="purple"
            />
            <StatCard
              label="Generated"
              value={new Date(results.aggregationGeneratedAt).toLocaleDateString()}
              subtext={new Date(results.aggregationGeneratedAt).toLocaleTimeString()}
              icon={<Activity className="h-6 w-6" />}
              color="green"
            />
          </div>

          {/* Privacy Guarantee Banner */}
          <Alert className="mt-4 bg-green-50 border-green-200">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Privacy Guarantee:</strong> {results.privacyGuarantee}
            </AlertDescription>
          </Alert>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <Tabs defaultValue="demographics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="health">Health Metrics</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="bins">Bin Definitions</TabsTrigger>
            </TabsList>

            {/* Demographics Tab */}
            <TabsContent value="demographics" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.demographics.ageDistribution)}
                  title="Age Distribution"
                  xAxisLabel="Age Range"
                  yAxisLabel="Participants"
                  color={COLORS.demographics[0]}
                />
                <DistributionPieChart
                  data={transformDistribution(aggregatedData.demographics.genderDistribution)}
                  title="Gender Distribution"
                  colors={COLORS.demographics}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.demographics.regionDistribution)}
                  title="Geographic Distribution"
                  xAxisLabel="Region"
                  yAxisLabel="Participants"
                  color={COLORS.demographics[2]}
                />
                <DistributionPieChart
                  data={transformDistribution(aggregatedData.bloodTypeDistribution)}
                  title="Blood Type Distribution"
                  colors={COLORS.primary}
                />
              </div>
            </TabsContent>

            {/* Health Metrics Tab */}
            <TabsContent value="health" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.healthMetrics.cholesterolDistribution)}
                  title="Cholesterol Levels (mg/dL)"
                  xAxisLabel="Cholesterol Range"
                  yAxisLabel="Participants"
                  color={COLORS.health[0]}
                />
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.healthMetrics.bmiDistribution)}
                  title="BMI Distribution"
                  xAxisLabel="BMI Category"
                  yAxisLabel="Participants"
                  color={COLORS.health[1]}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.healthMetrics.bloodPressureDistribution)}
                  title="Blood Pressure"
                  xAxisLabel="BP Category"
                  yAxisLabel="Participants"
                  color={COLORS.health[2]}
                />
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.healthMetrics.hba1cDistribution)}
                  title="HbA1c Levels (mmol/mol)"
                  xAxisLabel="HbA1c Range"
                  yAxisLabel="Participants"
                  color={COLORS.primary[5]}
                />
              </div>

              {/* Clinical Reference Guide */}
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Clinical References:</strong> Cholesterol (AHA guidelines), HbA1c (ADA guidelines), BMI (WHO guidelines), Blood Pressure (AHA guidelines)
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Lifestyle Tab */}
            <TabsContent value="lifestyle" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <DistributionPieChart
                  data={transformDistribution(aggregatedData.lifestyle.smokingDistribution)}
                  title="Smoking Status"
                  colors={COLORS.lifestyle}
                />
                <DistributionBarChart
                  data={transformDistribution(aggregatedData.lifestyle.activityDistribution)}
                  title="Physical Activity Level"
                  xAxisLabel="Activity Level"
                  yAxisLabel="Participants"
                  color={COLORS.lifestyle[0]}
                />
              </div>
            </TabsContent>

            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <DistributionPieChart
                  data={transformDistribution(aggregatedData.conditions.diabetesDistribution)}
                  title="Diabetes Status"
                  colors={COLORS.health}
                />
                <DistributionPieChart
                  data={transformDistribution(aggregatedData.conditions.heartDiseaseDistribution)}
                  title="Heart Disease Status"
                  colors={[COLORS.health[0], COLORS.health[2]]}
                />
              </div>
            </TabsContent>

            {/* Bin Definitions Tab */}
            <TabsContent value="bins" className="space-y-6 mt-6">
              <Alert className="bg-purple-50 border-purple-200">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>Transparency Note:</strong> These bin definitions were generated when the study was created and are stored immutably on-chain. They determine how raw medical data is categorized while preserving privacy.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-6">
                {binDefinitions.age && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      Age Bins
                      <Badge variant="outline" className="ml-2">
                        {binDefinitions.age.binCount} bins
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {binDefinitions.age.boundaries.map((boundary, idx) => {
                        if (!binDefinitions.age || idx === binDefinitions.age.boundaries.length - 1) return null;
                        const next = binDefinitions.age.boundaries[idx + 1];
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">
                              Bin {idx}: {boundary} - {next === 999999 ? '∞' : next}
                            </span>
                            <Badge variant="secondary">
                              {aggregatedData.demographics.ageDistribution[`${boundary}-${next}`] || 0} participants
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {binDefinitions.cholesterol && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      Cholesterol Bins (mg/dL)
                      <Badge variant="outline" className="ml-2">
                        {binDefinitions.cholesterol.binCount} bins
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {binDefinitions.cholesterol.boundaries.map((boundary, idx) => {
                        if (!binDefinitions.cholesterol || idx === binDefinitions.cholesterol.boundaries.length - 1) return null;
                        const next = binDefinitions.cholesterol.boundaries[idx + 1];
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">
                              Bin {idx}: {boundary} - {next === 999999 ? '∞' : next}
                            </span>
                            <Badge variant="secondary">Clinical threshold</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {binDefinitions.bmi && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      BMI Bins (×10)
                      <Badge variant="outline" className="ml-2">
                        {binDefinitions.bmi.binCount} bins
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {binDefinitions.bmi.boundaries.map((boundary, idx) => {
                        if (!binDefinitions.bmi || idx === binDefinitions.bmi.boundaries.length - 1) return null;
                        const next = binDefinitions.bmi.boundaries[idx + 1];
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">
                              Bin {idx}: {(boundary / 10).toFixed(1)} - {next === 999999 ? '∞' : (next / 10).toFixed(1)}
                            </span>
                            <Badge variant="secondary">WHO category</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {binDefinitions.hba1c && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      HbA1c Bins (mmol/mol)
                      <Badge variant="outline" className="ml-2">
                        {binDefinitions.hba1c.binCount} bins
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {binDefinitions.hba1c.boundaries.map((boundary, idx) => {
                        if (!binDefinitions.hba1c || idx === binDefinitions.hba1c.boundaries.length - 1) return null;
                        const next = binDefinitions.hba1c.boundaries[idx + 1];
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">
                              Bin {idx}: {boundary} - {next === 999999 ? '∞' : next}
                            </span>
                            <Badge variant="secondary">ADA guideline</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

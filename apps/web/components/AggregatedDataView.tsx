import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  triggerDataAggregation, 
  getAggregatedData, 
  getAccessLogs,
  type AggregatedDataResponse,
  type AccessLog,
  type TriggerAggregationRequest,
} from '@/services/api/studyDataService';
import { 
  Info,
  Lock,
  RefreshCw,
  Download,
} from 'lucide-react';

interface AggregatedDataViewProps {
  studyId: number;
  studyAddress: string;
  studyStatus: string;
  isCreator: boolean;
}

export function AggregatedDataView({ studyId, studyAddress, studyStatus, isCreator }: AggregatedDataViewProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedDataResponse | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsTotal, setLogsTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('statistics');

  const logsLimit = 10;

  // Check if researcher can view data (must be creator and study must be ended)
  // Accept both "ENDED" (blockchain status) and "COMPLETED" (database status)
  const isStudyEnded = studyStatus === 'ENDED' || studyStatus === 'COMPLETED';
  const canViewData = isCreator && isStudyEnded;
  const canTriggerAggregation = isCreator && isStudyEnded;

  // Load aggregated data on mount
  useEffect(() => {
    if (canViewData) {
      loadAggregatedData();
    }
  }, [canViewData, studyId]);

  // Load access logs when switching to that tab
  useEffect(() => {
    if (activeTab === 'logs' && canViewData) {
      loadAccessLogs(0);
    }
  }, [activeTab, canViewData]);

  const loadAggregatedData = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAggregatedData(studyId, address);
      setAggregatedData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load aggregated data');
      setAggregatedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccessLogs = async (offset: number) => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAccessLogs(studyId, address, logsLimit, offset);
      setAccessLogs(response.logs);
      setLogsTotal(response.pagination.total);
      setLogsOffset(offset);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load access logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAggregation = async () => {
    if (!address) return;

    setIsAggregating(true);
    setError(null);

    try {
      const requestData: TriggerAggregationRequest = {
        researcherAddress: address,
      };
      const result = await triggerDataAggregation(studyId, requestData);
      
      // Show success message
      if (result.participantCount < 10) {
        setError(`Aggregation complete, but data is not available yet. Need at least 10 participants (currently ${result.participantCount}).`);
      } else {
        // Reload the aggregated data
        await loadAggregatedData();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to trigger data aggregation');
    } finally {
      setIsAggregating(false);
    }
  };

  const downloadDataAsJSON = () => {
    if (!aggregatedData) return;

    const dataStr = JSON.stringify(aggregatedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-${studyAddress}-aggregated-data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isCreator) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Only the study creator can view aggregated data.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isStudyEnded) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Aggregated data will be available once the study has ended. Current status: <Badge variant="outline">{studyStatus}</Badge>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trigger Aggregation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Aggregation</CardTitle>
          <CardDescription>
            Generate anonymized statistics from participant data. This process applies k-anonymity (minimum 10 participants)
            and differential privacy techniques to protect individual privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTriggerAggregation}
            disabled={isAggregating || !canTriggerAggregation}
            className="w-full sm:w-auto"
          >
            {isAggregating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {isAggregating ? 'Aggregating Data...' : 'Trigger Data Aggregation'}
          </Button>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Protection:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Minimum 10 participants required (k-anonymity threshold)</li>
                <li>Small bins (&lt;3 participants) are suppressed</li>
                <li>Laplace noise added for differential privacy</li>
                <li>Individual data cannot be reconstructed</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Aggregated Data Display */}
      {aggregatedData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="logs">Access Logs</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Aggregated Statistics</CardTitle>
                    <CardDescription>
                      Anonymized data from {aggregatedData.participantCount} participants
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadDataAsJSON}>
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Privacy Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Participant Count</div>
                    <div className="text-2xl font-bold">{aggregatedData.participantCount}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">K-Anonymity</div>
                    <div className="text-2xl font-bold">{aggregatedData.privacyMetrics.kAnonymity}</div>
                    <div className="text-xs text-muted-foreground">Minimum group size</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Generated At</div>
                    <div className="text-sm font-medium">{formatDate(aggregatedData.aggregatedAt)}</div>
                  </div>
                </div>

                {/* Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Demographics</CardTitle>
                    <CardDescription>
                      {aggregatedData.statistics.demographics.totalParticipants} total participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Age Ranges */}
                    {aggregatedData.statistics.demographics.ageRanges && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Age Distribution</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Age Range</TableHead>
                              <TableHead>Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(aggregatedData.statistics.demographics.ageRanges).map(([range, count]) => (
                              <TableRow key={range}>
                                <TableCell>{range}</TableCell>
                                <TableCell>{count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Gender Distribution */}
                    {aggregatedData.statistics.demographics.genderDistribution && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Gender Distribution</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Gender</TableHead>
                              <TableHead>Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(aggregatedData.statistics.demographics.genderDistribution).map(([gender, count]) => (
                              <TableRow key={gender}>
                                <TableCell>{gender}</TableCell>
                                <TableCell>{count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Health Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cholesterol */}
                    {aggregatedData.statistics.healthMetrics.cholesterol && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Cholesterol (mg/dL)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Mean</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.cholesterol.mean.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Median</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.cholesterol.median.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Std Dev</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.cholesterol.stdDev.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BMI */}
                    {aggregatedData.statistics.healthMetrics.bmi && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">BMI</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Mean</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.bmi.mean.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Median</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.bmi.median.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Std Dev</div>
                            <div className="font-medium">{aggregatedData.statistics.healthMetrics.bmi.stdDev.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Blood Pressure */}
                    {aggregatedData.statistics.healthMetrics.bloodPressure && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Blood Pressure (mmHg)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Systolic</div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-xs">Mean:</span>
                                <span className="font-medium">{aggregatedData.statistics.healthMetrics.bloodPressure.systolic.mean.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs">Median:</span>
                                <span className="font-medium">{aggregatedData.statistics.healthMetrics.bloodPressure.systolic.median.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Diastolic</div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-xs">Mean:</span>
                                <span className="font-medium">{aggregatedData.statistics.healthMetrics.bloodPressure.diastolic.mean.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs">Median:</span>
                                <span className="font-medium">{aggregatedData.statistics.healthMetrics.bloodPressure.diastolic.median.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lifestyle Factors */}
                {(aggregatedData.statistics.lifestyle.smokingStatus || aggregatedData.statistics.lifestyle.activityLevel) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Lifestyle Factors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Smoking Status */}
                      {aggregatedData.statistics.lifestyle.smokingStatus && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Smoking Status</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Count</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(aggregatedData.statistics.lifestyle.smokingStatus).map(([status, count]) => (
                                <TableRow key={status}>
                                  <TableCell>{status}</TableCell>
                                  <TableCell>{count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Activity Level */}
                      {aggregatedData.statistics.lifestyle.activityLevel && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Activity Level (min/week)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Mean</div>
                              <div className="font-medium">{aggregatedData.statistics.lifestyle.activityLevel.mean.toFixed(0)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Median</div>
                              <div className="font-medium">{aggregatedData.statistics.lifestyle.activityLevel.median.toFixed(0)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Logs</CardTitle>
                <CardDescription>
                  Audit trail of all data access attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && logsOffset === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading access logs...
                  </div>
                ) : accessLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No access logs found
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Researcher</TableHead>
                          <TableHead>Participants</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accessLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.accessed_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.access_type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.accessed_by.slice(0, 6)}...{log.accessed_by.slice(-4)}
                            </TableCell>
                            <TableCell>{log.participant_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {logsOffset + 1} - {Math.min(logsOffset + logsLimit, logsTotal)} of {logsTotal}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadAccessLogs(Math.max(0, logsOffset - logsLimit))}
                          disabled={isLoading || logsOffset === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadAccessLogs(logsOffset + logsLimit)}
                          disabled={isLoading || logsOffset + logsLimit >= logsTotal}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

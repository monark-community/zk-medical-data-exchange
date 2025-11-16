/**
 * Study Results Service
 * 
 * Handles fetching aggregated study results with privacy metadata and visualizations data
 */

import { Config } from '@/config/config';

export interface BinDefinition {
  enabled: boolean;
  boundaries: number[];
  binCount: number;
}

export interface StudyBins {
  age?: BinDefinition;
  cholesterol?: BinDefinition;
  bmi?: BinDefinition;
  hba1c?: BinDefinition;
}

export interface AggregatedStatistics {
  demographics: {
    totalParticipants: number;
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    regionDistribution: Record<string, number>;
  };
  healthMetrics: {
    cholesterolDistribution: Record<string, number>;
    bmiDistribution: Record<string, number>;
    bloodPressureDistribution: Record<string, number>;
    hba1cDistribution: Record<string, number>;
  };
  lifestyle: {
    smokingDistribution: Record<string, number>;
    activityDistribution: Record<string, number>;
  };
  conditions: {
    diabetesDistribution: Record<string, number>;
    heartDiseaseDistribution: Record<string, number>;
  };
  bloodTypeDistribution: Record<string, number>;
}

export interface StudyAggregatedResults {
  studyId: number;
  studyTitle: string;
  studyDescription: string;
  status: string;
  
  // Privacy metadata
  privacyGuarantee: string;
  aggregationMethod: string;
  participantCount: number;
  activeConsentCount: number;
  meetsKAnonymity: boolean;
  
  // Bin definitions for transparency
  binDefinitions: StudyBins;
  
  // Aggregated statistics
  aggregatedData: AggregatedStatistics;
  
  // Timestamps
  studyCreatedAt: string;
  studyEndDate: string;
  aggregationGeneratedAt: string;
}

/**
 * Fetch aggregated results for a study
 */
export async function fetchStudyAggregatedResults(
  studyId: number,
  walletAddress: string
): Promise<StudyAggregatedResults> {
  const response = await fetch(
    `${Config.APP_API_URL}/studies/${studyId}/aggregated-results?wallet=${encodeURIComponent(walletAddress)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch aggregated results');
  }

  return response.json();
}

/**
 * Trigger ZK-based aggregation for a study
 */
export async function triggerStudyAggregation(
  studyId: number,
  walletAddress: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${Config.APP_API_URL}/studies/${studyId}/aggregate-zk`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger aggregation');
  }

  return response.json();
}

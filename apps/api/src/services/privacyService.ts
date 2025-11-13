import logger from '../utils/logger.js';
import type { AggregatedStatistics } from './dataAggregationService.js';

const MIN_BIN_SIZE = 3;
const NOISE_SCALE = 0.1;

export function validateKAnonymity(stats: AggregatedStatistics): AggregatedStatistics {
  const enhanced: AggregatedStatistics = JSON.parse(JSON.stringify(stats)); // Deep copy

  enhanced.demographics.ageRanges = suppressSmallBins(stats.demographics.ageRanges);
  if (enhanced.demographics.genderDistribution) {
    enhanced.demographics.genderDistribution = suppressSmallBins(
      enhanced.demographics.genderDistribution
    );
  }
  if (enhanced.demographics.locationDistribution) {
    enhanced.demographics.locationDistribution = suppressSmallBins(
      enhanced.demographics.locationDistribution
    );
  }

  if (enhanced.healthMetrics.cholesterol?.ranges) {
    enhanced.healthMetrics.cholesterol.ranges = suppressSmallBins(
      enhanced.healthMetrics.cholesterol.ranges
    );
  }
  if (enhanced.healthMetrics.bmi?.ranges) {
    enhanced.healthMetrics.bmi.ranges = suppressSmallBins(enhanced.healthMetrics.bmi.ranges);
  }

  if (enhanced.bloodTypes) {
    enhanced.bloodTypes = suppressSmallBins(enhanced.bloodTypes);
  }

  if (enhanced.lifestyle.smokingStatus) {
    enhanced.lifestyle.smokingStatus = suppressSmallBins(enhanced.lifestyle.smokingStatus);
  }
  if (enhanced.lifestyle.activityLevel?.ranges) {
    enhanced.lifestyle.activityLevel.ranges = suppressSmallBins(
      enhanced.lifestyle.activityLevel.ranges
    );
  }

  if (enhanced.conditions.diabetesDistribution) {
    enhanced.conditions.diabetesDistribution = suppressSmallBins(
      enhanced.conditions.diabetesDistribution
    );
  }
  if (enhanced.conditions.heartDiseaseHistory) {
    enhanced.conditions.heartDiseaseHistory = suppressSmallBins(
      enhanced.conditions.heartDiseaseHistory
    );
  }

  logger.info({ totalParticipants: stats.demographics.totalParticipants }, 'Applied privacy enhancements to statistics');

  return enhanced;
}

function suppressSmallBins(distribution: Record<string, number>): Record<string, number> {
  const enhanced: Record<string, number> = {};

  for (const [key, count] of Object.entries(distribution)) {
    if (count >= MIN_BIN_SIZE) {
      const noisyCount = addLaplaceNoise(count, NOISE_SCALE);
      enhanced[key] = Math.max(MIN_BIN_SIZE, Math.round(noisyCount));
    } else {
      logger.debug({ key, count }, 'Suppressed small bin for privacy');
    }
  }

  return enhanced;
}

function addLaplaceNoise(value: number, scale: number): number {
  const u = Math.random() - 0.5;
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

  return value + noise;
}

export function meetsKAnonymityThreshold(participantCount: number): boolean {
  const K_ANONYMITY_THRESHOLD = 10;
  return participantCount >= K_ANONYMITY_THRESHOLD;
}

export function generalizeValue(value: number, ranges: Array<{ min: number; max: number; label: string }>): string {
  for (const range of ranges) {
    if (value >= range.min && value < range.max) {
      return range.label;
    }
  }
  return 'Unknown';
}

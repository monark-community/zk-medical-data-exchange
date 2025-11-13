import type { MedicalData } from '../types/medicalData.js';
import type { AggregatedStatistics } from './dataAggregationService.js';

export function computeAggregateStatistics(
  medicalDataArray: MedicalData[]
): AggregatedStatistics {
  const stats: AggregatedStatistics = {
    demographics: {
      totalParticipants: medicalDataArray.length,
      ageRanges: {},
      genderDistribution: {},
      locationDistribution: {},
    },
    healthMetrics: {},
    lifestyle: {},
    conditions: {},
  };

  const ages: number[] = [];
  const cholesterols: number[] = [];
  const bmis: number[] = [];
  const systolics: number[] = [];
  const diastolics: number[] = [];
  const hba1cs: number[] = [];
  const activities: number[] = [];

  const genders: Record<string, number> = {};
  const locations: Record<string, number> = {};
  const bloodTypes: Record<string, number> = {};
  const smokingStatuses: Record<string, number> = {};
  const diabetesTypes: Record<string, number> = {};
  const heartDiseaseHistory: Record<string, number> = { no: 0, yes: 0 };

  for (const data of medicalDataArray) {
    if (data.age !== undefined) ages.push(data.age);
    if (data.gender) genders[data.gender] = (genders[data.gender] || 0) + 1;
    if (data.location) {
      const loc = String(data.location);
      locations[loc] = (locations[loc] || 0) + 1;
    }

    if (data.cholesterol !== undefined) cholesterols.push(data.cholesterol);
    if (data.bmi !== undefined) bmis.push(data.bmi);
    if (data.bloodPressure) {
      systolics.push(data.bloodPressure.systolic);
      diastolics.push(data.bloodPressure.diastolic);
    }
    if (data.hba1c !== undefined) hba1cs.push(data.hba1c);
    if (data.bloodType) bloodTypes[data.bloodType] = (bloodTypes[data.bloodType] || 0) + 1;

    if (data.smokingStatus) {
      smokingStatuses[data.smokingStatus] = (smokingStatuses[data.smokingStatus] || 0) + 1;
    }
    if (data.activityLevel !== undefined) activities.push(data.activityLevel);

    if (data.diabetesType) {
      diabetesTypes[data.diabetesType] = (diabetesTypes[data.diabetesType] || 0) + 1;
    }
    if (data.heartDiseaseHistory !== undefined) {
      const key = data.heartDiseaseHistory ? 'yes' : 'no';
      heartDiseaseHistory[key] = (heartDiseaseHistory[key] || 0) + 1;
    }
  }

  if (ages.length > 0) {
    stats.demographics.ageRanges = computeRangeDistribution(ages, [
      { min: 0, max: 20, label: '0-20' },
      { min: 20, max: 30, label: '20-30' },
      { min: 30, max: 40, label: '30-40' },
      { min: 40, max: 50, label: '40-50' },
      { min: 50, max: 60, label: '50-60' },
      { min: 60, max: 100, label: '60+' },
    ]);
  }

  if (Object.keys(genders).length > 0) stats.demographics.genderDistribution = genders;
  if (Object.keys(locations).length > 0) stats.demographics.locationDistribution = locations;

  if (cholesterols.length > 0) {
    stats.healthMetrics.cholesterol = {
      mean: mean(cholesterols),
      median: median(cholesterols),
      stdDev: standardDeviation(cholesterols),
      ranges: computeRangeDistribution(cholesterols, [
        { min: 0, max: 200, label: '<200 (Desirable)' },
        { min: 200, max: 240, label: '200-240 (Borderline)' },
        { min: 240, max: 1000, label: '>240 (High)' },
      ]),
    };
  }

  if (bmis.length > 0) {
    stats.healthMetrics.bmi = {
      mean: mean(bmis),
      median: median(bmis),
      stdDev: standardDeviation(bmis),
      ranges: computeRangeDistribution(bmis, [
        { min: 0, max: 18.5, label: 'Underweight' },
        { min: 18.5, max: 25, label: 'Normal' },
        { min: 25, max: 30, label: 'Overweight' },
        { min: 30, max: 100, label: 'Obese' },
      ]),
    };
  }

  if (systolics.length > 0 && diastolics.length > 0) {
    stats.healthMetrics.bloodPressure = {
      systolic: {
        mean: mean(systolics),
        median: median(systolics),
        stdDev: standardDeviation(systolics),
      },
      diastolic: {
        mean: mean(diastolics),
        median: median(diastolics),
        stdDev: standardDeviation(diastolics),
      },
    };
  }

  if (hba1cs.length > 0) {
    stats.healthMetrics.hba1c = {
      mean: mean(hba1cs),
      median: median(hba1cs),
      stdDev: standardDeviation(hba1cs),
    };
  }

  if (Object.keys(bloodTypes).length > 0) {
    stats.bloodTypes = bloodTypes;
  }

  if (Object.keys(smokingStatuses).length > 0) {
    stats.lifestyle.smokingStatus = smokingStatuses;
  }

  if (activities.length > 0) {
    stats.lifestyle.activityLevel = {
      mean: mean(activities),
      median: median(activities),
      ranges: computeRangeDistribution(activities, [
        { min: 0, max: 30, label: 'Sedentary (<30 min/week)' },
        { min: 30, max: 150, label: 'Low (30-150 min/week)' },
        { min: 150, max: 300, label: 'Moderate (150-300 min/week)' },
        { min: 300, max: 10000, label: 'High (>300 min/week)' },
      ]),
    };
  }

  if (Object.keys(diabetesTypes).length > 0) {
    stats.conditions.diabetesDistribution = diabetesTypes;
  }

  if ((heartDiseaseHistory.no || 0) > 0 || (heartDiseaseHistory.yes || 0) > 0) {
    stats.conditions.heartDiseaseHistory = heartDiseaseHistory;
  }

  return stats;
}

function computeRangeDistribution(
  values: number[],
  ranges: Array<{ min: number; max: number; label: string }>
): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const range of ranges) {
    const count = values.filter((v) => v >= range.min && v < range.max).length;
    if (count > 0) {
      distribution[range.label] = count;
    }
  }

  return distribution;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100; // Round to 2 decimals
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 100) / 100;
  } else {
    return sorted[mid]!;
  }
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = mean(values);
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.round(Math.sqrt(avgSquareDiff) * 100) / 100; // Round to 2 decimals
}

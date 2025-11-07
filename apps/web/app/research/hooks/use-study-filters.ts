import { useState, useMemo } from 'react';
import { ResearchStudy } from '../components/study-card';

interface Filters {
  status: string[];
  duration: string[];
  rewardRange: string[];
  dataTypes: string[];
  participantRange: string[];
}

export const filterOptions = {
  status: ['recruiting', 'active'],
  duration: ['0-3 months', '3-6 months', '6-12 months', '12+ months'],
  rewardRange: ['$0-20', '$20-40', '$40-60', '$60+'],
  dataTypes: ['Wearable', 'Nutrition', 'Medical History', 'Sleep', 'Mental Health', 
              'Survey', 'Cardiovascular', 'Medical Records', 'Genomic', 'Pharmaceutical', 'Family History'],
  participantRange: ['0-1000', '1000-3000', '3000-5000', '5000+'],
};

const matchesDuration = (duration: string, ranges: string[]): boolean => {
  if (ranges.length === 0) return true;
  const months = parseInt(duration);
  return ranges.some(range => {
    if (range === '0-3 months') return months <= 3;
    if (range === '3-6 months') return months > 3 && months <= 6;
    if (range === '6-12 months') return months > 6 && months <= 12;
    if (range === '12+ months') return months > 12;
    return false;
  });
};

const matchesReward = (reward: number, ranges: string[]): boolean => {
  if (ranges.length === 0) return true;
  return ranges.some(range => {
    if (range === '$0-20') return reward >= 0 && reward <= 20;
    if (range === '$20-40') return reward > 20 && reward <= 40;
    if (range === '$40-60') return reward > 40 && reward <= 60;
    if (range === '$60+') return reward > 60;
    return false;
  });
};

const matchesParticipants = (participants: number, ranges: string[]): boolean => {
  if (ranges.length === 0) return true;
  return ranges.some(range => {
    if (range === '0-1000') return participants >= 0 && participants <= 1000;
    if (range === '1000-3000') return participants > 1000 && participants <= 3000;
    if (range === '3000-5000') return participants > 3000 && participants <= 5000;
    if (range === '5000+') return participants > 5000;
    return false;
  });
};

export function useStudyFilters(studies: ResearchStudy[], searchQuery: string) {
  const [filters, setFilters] = useState<Filters>({
    status: [],
    duration: [],
    rewardRange: [],
    dataTypes: [],
    participantRange: [],
  });

  const toggleFilter = (category: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      duration: [],
      rewardRange: [],
      dataTypes: [],
      participantRange: [],
    });
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(arr => arr.length > 0),
    [filters]
  );

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const matchesSearch = study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filters.status.length === 0 || filters.status.includes(study.status);
      const matchesDurationFilter = matchesDuration(study.duration, filters.duration);
      const matchesRewardFilter = matchesReward(study.reward, filters.rewardRange);
      const matchesDataTypes = filters.dataTypes.length === 0 || 
        filters.dataTypes.some((type: string) => study.dataTypes.includes(type));
      const matchesParticipantRange = matchesParticipants(study.participants, filters.participantRange);

      return matchesSearch && matchesStatus && matchesDurationFilter && 
             matchesRewardFilter && matchesDataTypes && matchesParticipantRange;
    });
  }, [studies, searchQuery, filters]);

  return {
    filters,
    toggleFilter,
    clearAllFilters,
    hasActiveFilters,
    filteredStudies,
  };
}

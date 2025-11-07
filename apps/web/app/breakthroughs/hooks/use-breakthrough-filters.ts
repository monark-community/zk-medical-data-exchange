import { useState, useMemo } from 'react';
import { Breakthrough } from '../components/breakthrough-card';

export const industries = [
  { value: 'all', label: 'All Industries' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'pharmacology', label: 'Pharmacology' }
];

export function useBreakthroughFilters(breakthroughs: Breakthrough[], searchQuery: string) {
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const filteredBreakthroughs = useMemo(() => {
    return breakthroughs.filter(breakthrough => {
      const matchesSearch = breakthrough.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           breakthrough.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = selectedIndustry === 'all' || breakthrough.industry === selectedIndustry;
      return matchesSearch && matchesIndustry;
    });
  }, [breakthroughs, searchQuery, selectedIndustry]);

  return {
    selectedIndustry,
    setSelectedIndustry,
    filteredBreakthroughs,
  };
}

import React from 'react';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { industries } from '../hooks/use-breakthrough-filters';

interface FilterControlsProps {
  selectedIndustry: string;
  // eslint-disable-next-line no-unused-vars
  setSelectedIndustry: (_value: string) => void;
}

export function FilterControls({ selectedIndustry, setSelectedIndustry }: FilterControlsProps) {
  return (
    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
      <SelectTrigger className="w-full md:w-64 h-12">
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Filter by industry" />
      </SelectTrigger>
      <SelectContent>
        {industries.map((industry) => (
          <SelectItem key={industry.value} value={industry.value}>
            {industry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

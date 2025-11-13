import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { filterOptions } from '../hooks/use-study-filters';

interface Filters {
  status: string[];
  duration: string[];
  rewardRange: string[];
  dataTypes: string[];
  participantRange: string[];
}

interface FilterControlsProps {
  filters: Filters;
  // eslint-disable-next-line no-unused-vars
  toggleFilter: (_category: keyof Filters, _value: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterControls({ 
  filters, 
  toggleFilter, 
  clearAllFilters, 
  hasActiveFilters 
}: FilterControlsProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto h-12 flex items-center space-x-2 relative">
            <Filter className="w-4 h-4" />
            <span>Filter Studies</span>
            {hasActiveFilters && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600">
                {Object.values(filters).reduce((acc, arr) => acc + arr.length, 0)}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-[500px] overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <DropdownMenuLabel className="p-0">Filters</DropdownMenuLabel>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />

            <div className="py-2">
              <div className="text-sm font-medium mb-2 px-2 text-gray-700">Status</div>
              {filterOptions.status.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => toggleFilter('status', status)}
                >
                  <span className="capitalize">{status}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />

            <div className="py-2">
              <div className="text-sm font-medium mb-2 px-2 text-gray-700">Duration</div>
              {filterOptions.duration.map((duration) => (
                <DropdownMenuCheckboxItem
                  key={duration}
                  checked={filters.duration.includes(duration)}
                  onCheckedChange={() => toggleFilter('duration', duration)}
                >
                  {duration}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />

            <div className="py-2">
              <div className="text-sm font-medium mb-2 px-2 text-gray-700">Reward Range</div>
              {filterOptions.rewardRange.map((range) => (
                <DropdownMenuCheckboxItem
                  key={range}
                  checked={filters.rewardRange.includes(range)}
                  onCheckedChange={() => toggleFilter('rewardRange', range)}
                >
                  {range}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />

            <div className="py-2">
              <div className="text-sm font-medium mb-2 px-2 text-gray-700">Participants</div>
              {filterOptions.participantRange.map((range) => (
                <DropdownMenuCheckboxItem
                  key={range}
                  checked={filters.participantRange.includes(range)}
                  onCheckedChange={() => toggleFilter('participantRange', range)}
                >
                  {range} participants
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />

            <div className="py-2">
              <div className="text-sm font-medium mb-2 px-2 text-gray-700">Data Types</div>
              {filterOptions.dataTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.dataTypes.includes(type)}
                  onCheckedChange={() => toggleFilter('dataTypes', type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

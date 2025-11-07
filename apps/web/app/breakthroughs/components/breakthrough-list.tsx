import React from 'react';
import { BreakthroughCard, Breakthrough } from './breakthrough-card';
import { Search } from 'lucide-react';

interface BreakthroughListProps {
  breakthroughs: Breakthrough[];
}

export function BreakthroughList({ breakthroughs }: BreakthroughListProps) {
  if (breakthroughs.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No breakthroughs found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 mb-8">
      {breakthroughs.map((breakthrough) => (
        <BreakthroughCard key={breakthrough.id} breakthrough={breakthrough} />
      ))}
    </div>
  );
}

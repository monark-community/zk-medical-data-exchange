import React from 'react';
import { Search } from 'lucide-react';
import { StudyCard, ResearchStudy } from './study-card';

interface StudyListProps {
  studies: ResearchStudy[];
  onJoinStudy: () => void;
}

export function StudyList({ studies, onJoinStudy }: StudyListProps) {
  if (studies.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No studies found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {studies.map((study) => (
        <StudyCard 
          key={study.id} 
          study={study} 
          onJoinStudy={onJoinStudy}
        />
      ))}
    </div>
  );
}

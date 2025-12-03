"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react'; 
import { useWeb3AuthLogin } from '@/hooks/useAuth';
import CustomNavbar from '@/components/navigation/customNavBar';
import Footer from '@/components/footer';
import { ResearchStudy } from './components/study-card';
import { StudyList } from './components/study-list';
import { FilterControls } from './components/filter-controls';
import { useStudyFilters } from './hooks/use-study-filters';

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { login } = useWeb3AuthLogin();

  const researchStudies: ResearchStudy[] = require('./data/studies.json');

  const {
    filters,
    toggleFilter,
    clearAllFilters,
    hasActiveFilters,
    filteredStudies,
  } = useStudyFilters(researchStudies, searchQuery);

  const handleJoinStudy = () => {
    login();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <CustomNavbar />
      
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-white">
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center mb-16 mx-5 sm:mx-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Research Studies
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Contribute to groundbreaking medical research and earn rewards while maintaining complete privacy. 
              Join studies that are shaping the future of healthcare.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search research studies, organizations, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-sm sm:text-base bg-white"
              />
            </div>
            
            <FilterControls
              filters={filters}
              toggleFilter={toggleFilter}
              clearAllFilters={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <StudyList 
            studies={filteredStudies} 
            onJoinStudy={handleJoinStudy}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};
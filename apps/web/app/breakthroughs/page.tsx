"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CustomNavbar from '@/components/navigation/customNavBar';
import Footer from '@/components/footer';
import { Breakthrough } from './components/breakthrough-card';
import { BreakthroughList } from './components/breakthrough-list';
import { FilterControls } from './components/filter-controls';
import { useBreakthroughFilters } from './hooks/use-breakthrough-filters';

export default function BreakthroughsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const breakthroughs: Breakthrough[] = require('./data/breakthroughs.json');

  const {
    selectedIndustry,
    setSelectedIndustry,
    filteredBreakthroughs,
  } = useBreakthroughFilters(breakthroughs, searchQuery);

  return (
    <>
      <CustomNavbar />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Breakthrough Explorer
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the latest medical breakthroughs powered by Cura's privacy-first data sharing platform. 
              Explore research papers, clinical studies, and real-world applications.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search breakthroughs, researchers, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <FilterControls
              selectedIndustry={selectedIndustry}
              setSelectedIndustry={setSelectedIndustry}
            />
          </div>

          <BreakthroughList breakthroughs={filteredBreakthroughs} />
        </div>

        <Footer />
      </div>
    </>
  );
};
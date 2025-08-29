
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Coins, 
  Shield, 
  Clock,
  Star,
  Building
} from 'lucide-react';

const Research = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const researchStudies = [
    {
      id: 1,
      title: 'Diabetes Prevention Through Lifestyle Data',
      organization: 'Stanford Medical Center',
      description: 'Studying the correlation between daily activity patterns, dietary habits, and diabetes risk factors.',
      participants: 2847,
      reward: 25.50,
      duration: '6 months',
      requirements: ['Age 18-65', 'Fitness tracker data', 'Dietary logs'],
      status: 'recruiting',
      rating: 4.8,
      dataTypes: ['Wearable', 'Nutrition', 'Medical History']
    },
    {
      id: 2,
      title: 'Sleep Quality and Mental Health Correlation',
      organization: 'Harvard Sleep Research Lab',
      description: 'Investigating the relationship between sleep patterns and mental health indicators.',
      participants: 1523,
      reward: 18.75,
      duration: '3 months',
      requirements: ['Sleep tracking device', 'Mental health assessments', 'Daily surveys'],
      status: 'recruiting',
      rating: 4.9,
      dataTypes: ['Sleep', 'Mental Health', 'Survey']
    },
    {
      id: 3,
      title: 'Cardiovascular Risk Prediction Model',
      organization: 'Mayo Clinic',
      description: 'Developing AI models to predict cardiovascular events using multimodal health data.',
      participants: 5234,
      reward: 35.00,
      duration: '12 months',
      requirements: ['Heart rate data', 'Blood pressure logs', 'Exercise data'],
      status: 'active',
      rating: 4.7,
      dataTypes: ['Cardiovascular', 'Wearable', 'Medical Records']
    },
    {
      id: 4,
      title: 'Genetic Factors in Drug Response',
      organization: 'Johns Hopkins Genomics Institute',
      description: 'Understanding how genetic variations affect individual responses to medications.',
      participants: 892,
      reward: 75.00,
      duration: '9 months',
      requirements: ['Genetic testing consent', 'Medication history', 'Family medical history'],
      status: 'recruiting',
      rating: 4.6,
      dataTypes: ['Genomic', 'Pharmaceutical', 'Family History']
    }
  ];

  const filteredStudies = researchStudies.filter(study =>
    study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    study.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    study.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-20">
        {/* Header Section - Similar to Breakthroughs */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Research Studies
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Contribute to groundbreaking medical research and earn rewards while maintaining complete privacy. 
            Join studies that are shaping the future of healthcare.
          </p>
        </div>

        {/* Search and Filter - Matching Breakthroughs styling */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search research studies, organizations, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="w-full md:w-auto h-12 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter Studies</span>
          </Button>
        </div>

        {/* Research Studies */}
        <div className="space-y-6">
          {filteredStudies.map((study) => (
            <Card key={study.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{study.title}</h3>
                        <div className="flex items-center space-x-2 text-gray-600 mb-2">
                          <Building className="w-4 h-4" />
                          <span className="text-sm">{study.organization}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{study.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={study.status === 'recruiting' ? 'default' : 'secondary'}
                        className={study.status === 'recruiting' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {study.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{study.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {study.dataTypes.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{study.participants.toLocaleString()} participants</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{study.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-gray-400" />
                        <span>${study.reward} reward</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span>ZK Privacy</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:ml-6 lg:flex-shrink-0">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {study.requirements.map((req, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600">
                      Join Study
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudies.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No studies found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Research;

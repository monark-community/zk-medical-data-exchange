import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Coins, Shield, Star, Building } from 'lucide-react';

export interface ResearchStudy {
  id: number;
  title: string;
  organization: string;
  description: string;
  participants: number;
  reward: number;
  duration: string;
  requirements: string[];
  status: string;
  rating: number;
  dataTypes: string[];
}

interface StudyCardProps {
  study: ResearchStudy;
  onJoinStudy: () => void;
}

export function StudyCard({ study, onJoinStudy }: StudyCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
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
              {study.dataTypes.map((type: string, index: number) => (
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
                {study.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button 
              onClick={onJoinStudy} 
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600"
            >
              Join Study
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

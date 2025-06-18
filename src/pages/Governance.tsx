
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Vote, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  MessageSquare,
  Gavel,
  Shield
} from 'lucide-react';

const Governance = () => {
  const [activeTab, setActiveTab] = useState('proposals');

  const proposals = [
    {
      id: 1,
      title: 'Increase Minimum Reward for Genomic Data Sharing',
      description: 'Proposal to raise the minimum compensation for genetic data contributions from $50 to $75 per study to better reflect the value and sensitivity of genomic information.',
      author: '0x742d...a5b2',
      status: 'active',
      votes: { for: 2847, against: 432, abstain: 186 },
      timeLeft: '3 days',
      category: 'Economics',
      quorum: 85
    },
    {
      id: 2,
      title: 'Enhanced Privacy Protocol for Mental Health Data',
      description: 'Implement additional zero-knowledge proof layers specifically for mental health data to ensure maximum privacy protection.',
      author: '0x8f3e...d9c1',
      status: 'active',
      votes: { for: 3254, against: 289, abstain: 145 },
      timeLeft: '5 days',
      category: 'Privacy',
      quorum: 92
    },
    {
      id: 3,
      title: 'Research Ethics Review Board Expansion',
      description: 'Add three new members to the ethics review board to handle the increasing volume of research proposals and ensure thorough ethical oversight.',
      author: '0x1a2b...f7e8',
      status: 'passed',
      votes: { for: 4102, against: 234, abstain: 98 },
      timeLeft: 'Completed',
      category: 'Governance',
      quorum: 100
    },
    {
      id: 4,
      title: 'Data Retention Policy Update',
      description: 'Update the maximum data retention period from 5 years to 7 years for longitudinal studies while maintaining user consent requirements.',
      author: '0x9c4d...b3a6',
      status: 'pending',
      votes: { for: 0, against: 0, abstain: 0 },
      timeLeft: '7 days',
      category: 'Policy',
      quorum: 0
    }
  ];

  const governanceStats = {
    totalProposals: 47,
    activeVoters: 12543,
    averageParticipation: 78,
    totalVotingPower: 5420000
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'passed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Economics': return 'bg-purple-100 text-purple-700';
      case 'Privacy': return 'bg-blue-100 text-blue-700';
      case 'Governance': return 'bg-green-100 text-green-700';
      case 'Policy': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DAO Governance</h1>
          <p className="text-gray-600">Participate in platform governance and shape the future of Cura</p>
        </div>

        {/* Governance Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 text-center">
              <Gavel className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{governanceStats.totalProposals}</div>
              <div className="text-sm text-gray-600">Total Proposals</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{governanceStats.activeVoters.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Active Voters</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{governanceStats.averageParticipation}%</div>
              <div className="text-sm text-gray-600">Avg Participation</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 text-center">
              <Vote className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{(governanceStats.totalVotingPower / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Voting Power</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="voting">My Votes</TabsTrigger>
            <TabsTrigger value="create">Create Proposal</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{proposal.title}</h3>
                            <div className="flex items-center space-x-3 mb-3">
                              <Badge className={getStatusColor(proposal.status)}>
                                {proposal.status}
                              </Badge>
                              <Badge variant="outline" className={getCategoryColor(proposal.category)}>
                                {proposal.category}
                              </Badge>
                              <span className="text-sm text-gray-500">by {proposal.author}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{proposal.description}</p>
                        
                        {proposal.status === 'active' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Voting Progress</span>
                              <span className="text-gray-500">Quorum: {proposal.quorum}%</span>
                            </div>
                            <Progress value={proposal.quorum} className="h-2" />
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>For: {proposal.votes.for.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Against: {proposal.votes.against.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                <span>Abstain: {proposal.votes.abstain.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="lg:ml-6 lg:flex-shrink-0 lg:w-48">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">Time Left</span>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">{proposal.timeLeft}</div>
                        </div>
                        
                        {proposal.status === 'active' && (
                          <div className="space-y-2">
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Vote For
                            </Button>
                            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Vote Against
                            </Button>
                            <Button variant="outline" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Discuss
                            </Button>
                          </div>
                        )}
                        
                        {proposal.status === 'pending' && (
                          <Button variant="outline" className="w-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            Voting Soon
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="voting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Vote className="w-5 h-5" />
                  <span>Your Voting History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Votes Yet</h3>
                  <p className="text-gray-600 mb-6">Start participating in governance by voting on active proposals</p>
                  <Button onClick={() => setActiveTab('proposals')} className="bg-gradient-to-r from-blue-600 to-teal-600">
                    View Proposals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gavel className="w-5 h-5" />
                  <span>Create New Proposal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Proposal Creation</h3>
                  <p className="text-gray-600 mb-6">Create a new governance proposal to improve the Cura platform</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-teal-600">
                    <Shield className="w-4 h-4 mr-2" />
                    Create Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Governance;

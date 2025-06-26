import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Database, 
  Coins, 
  Activity, 
  Upload, 
  Eye, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  Building2,
  Pill,
  Search,
  FileSearch,
  ChartBar,
  ChartLine
} from 'lucide-react';

// Mock wallet state - in real app this would come from context/props
const mockWallet = {
  isConnected: true,
  address: '0x1234567890abcdef1234567890abcdef12345678',
  alias: 'HealthUser123',
  userType: 'data-seller' as 'data-seller' | 'researcher' // Change this to 'researcher' to test
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Data Seller Stats
  const userStats = {
    totalEarned: 245.80,
    dataPointsShared: 1247,
    activeStudies: 5,
    privacyScore: 100
  };

  // Researcher Stats
  const researcherStats = {
    activeProjects: 3,
    totalDatasets: 12,
    participantsReached: 8420,
    publicationsGenerated: 7
  };

  const recentActivity = [
    { type: 'reward', title: 'Diabetes Research Contribution', amount: 15.50, date: '2 hours ago', status: 'completed' },
    { type: 'data', title: 'Sleep Pattern Data Shared', amount: 8.25, date: '1 day ago', status: 'completed' },
    { type: 'consent', title: 'New Research Consent Given', amount: 0, date: '3 days ago', status: 'active' },
    { type: 'reward', title: 'Cardiovascular Study Reward', amount: 22.00, date: '1 week ago', status: 'completed' }
  ];

  const researcherActivity = [
    { type: 'dataset', title: 'Cardiovascular Health Dataset Analysis', participants: 1250, date: '2 hours ago', status: 'active' },
    { type: 'study', title: 'Sleep Pattern Research Published', participants: 850, date: '1 day ago', status: 'completed' },
    { type: 'request', title: 'Diabetes Data Request Approved', participants: 0, date: '3 days ago', status: 'pending' },
    { type: 'analysis', title: 'Mental Health Correlation Study', participants: 2100, date: '1 week ago', status: 'completed' }
  ];

  const dataVault = [
    { 
      name: 'Health Records', 
      type: 'EHR', 
      size: '2.4 MB', 
      lastUpdate: '2 days ago', 
      encrypted: true,
      institution: 'City General Hospital',
      institutionType: 'hospital'
    },
    { 
      name: 'Fitness Tracker Data', 
      type: 'Wearable', 
      size: '8.7 MB', 
      lastUpdate: '1 hour ago', 
      encrypted: true,
      institution: 'Self-Collected',
      institutionType: 'self'
    },
    { 
      name: 'Lab Results', 
      type: 'Medical', 
      size: '1.2 MB', 
      lastUpdate: '1 week ago', 
      encrypted: true,
      institution: 'LabCorp',
      institutionType: 'laboratory'
    },
    { 
      name: 'Prescription History', 
      type: 'Pharmacy', 
      size: '450 KB', 
      lastUpdate: '3 days ago', 
      encrypted: true,
      institution: 'CVS Pharmacy',
      institutionType: 'pharmacy'
    }
  ];

  const availableDatasets = [
    {
      name: 'Cardiovascular Health Study',
      category: 'Cardiology',
      participants: 15420,
      dataPoints: '2.1M',
      lastUpdate: '2 days ago',
      access: 'approved'
    },
    {
      name: 'Mental Health & Sleep Patterns',
      category: 'Psychology',
      participants: 8930,
      dataPoints: '890K',
      lastUpdate: '1 week ago',
      access: 'pending'
    },
    {
      name: 'Diabetes Management Tracking',
      category: 'Endocrinology',
      participants: 12100,
      dataPoints: '1.8M',
      lastUpdate: '3 days ago',
      access: 'approved'
    },
    {
      name: 'Cancer Treatment Outcomes',
      category: 'Oncology',
      participants: 5670,
      dataPoints: '1.2M',
      lastUpdate: '1 day ago',
      access: 'restricted'
    }
  ];

  const getInstitutionIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'pharmacy':
        return <Pill className="w-4 h-4 text-green-600" />;
      case 'laboratory':
        return <Activity className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInstitutionBadgeColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-blue-100 text-blue-700';
      case 'pharmacy':
        return 'bg-green-100 text-green-700';
      case 'laboratory':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAccessBadgeColor = (access: string) => {
    switch (access) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'restricted':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Determine if user is a researcher
  const isResearcher = mockWallet.userType === 'researcher';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isResearcher ? 'Research Dashboard' : 'Your Health Data Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isResearcher ? 'Access datasets and manage your research projects' : 'Manage your data contributions and track rewards'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {isResearcher ? (
            <>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <FileSearch className="w-8 h-8 text-blue-600" />
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{researcherStats.activeProjects}</div>
                  <div className="text-sm text-gray-600">Active Projects</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Database className="w-8 h-8 text-teal-600" />
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{researcherStats.totalDatasets}</div>
                  <div className="text-sm text-gray-600">Available Datasets</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-purple-600" />
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{researcherStats.participantsReached.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Participants Reached</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ChartBar className="w-8 h-8 text-green-600" />
                    <div className="text-xs font-medium text-green-700">PUBLISHED</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{researcherStats.publicationsGenerated}</div>
                  <div className="text-sm text-gray-600">Publications</div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Coins className="w-8 h-8 text-blue-600" />
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${userStats.totalEarned}</div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Database className="w-8 h-8 text-teal-600" />
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.dataPointsShared.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Data Points Shared</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-purple-600" />
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.activeStudies}</div>
                  <div className="text-sm text-gray-600">Active Studies</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div className="text-xs font-medium text-green-700">SECURE</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.privacyScore}%</div>
                  <div className="text-sm text-gray-600">Privacy Score</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value={isResearcher ? "datasets" : "vault"}>
              {isResearcher ? "Datasets" : "Data Vault"}
            </TabsTrigger>
            <TabsTrigger value="studies">Studies</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(isResearcher ? researcherActivity : recentActivity).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'reward' || activity.type === 'analysis' ? 'bg-green-100 text-green-600' :
                            activity.type === 'data' || activity.type === 'dataset' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'study' ? 'bg-purple-100 text-purple-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {(activity.type === 'reward' || activity.type === 'analysis') ? <Coins className="w-5 h-5" /> :
                             (activity.type === 'data' || activity.type === 'dataset') ? <Database className="w-5 h-5" /> :
                             activity.type === 'study' ? <FileSearch className="w-5 h-5" /> :
                             <CheckCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{activity.title}</div>
                            <div className="text-sm text-gray-500">{activity.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {activity.amount !== undefined && activity.amount > 0 && (
                            <div className="font-semibold text-green-600">+${activity.amount}</div>
                          )}
                          {'participants' in activity && activity.participants > 0 && (
                            <div className="font-semibold text-blue-600">{activity.participants.toLocaleString()} participants</div>
                          )}
                          <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ... keep existing code (privacy status card) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                    <div className="text-sm text-gray-600 mb-4">Data Encrypted</div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Zero-Knowledge Proofs</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Encrypted Storage</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Anonymous Matching</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value={isResearcher ? "datasets" : "vault"} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>{isResearcher ? 'Available Datasets' : 'Your Data Vault'}</span>
                </CardTitle>
                <Button className="bg-gradient-to-r from-blue-600 to-teal-600">
                  {isResearcher ? (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Request Dataset
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Data
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(isResearcher ? availableDatasets : dataVault).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                          {isResearcher ? (
                            <>
                              <div className="text-sm text-gray-500 mb-2">
                                {'category' in item && item.category} • {'participants' in item && `${item.participants.toLocaleString()} participants`} • {'dataPoints' in item && `${item.dataPoints} data points`}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={`text-xs ${getAccessBadgeColor('access' in item ? item.access : 'approved')}`}>
                                  {'access' in item && item.access}
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm text-gray-500 mb-2">{'type' in item && item.type} • {'size' in item && item.size} • Updated {'lastUpdate' in item && item.lastUpdate}</div>
                              <div className="flex items-center space-x-2">
                                <Badge className={`text-xs ${'institutionType' in item ? getInstitutionBadgeColor(item.institutionType) : 'bg-gray-100 text-gray-700'}`}>
                                  <div className="flex items-center space-x-1">
                                    {'institutionType' in item && getInstitutionIcon(item.institutionType)}
                                    <span>{'institution' in item && item.institution}</span>
                                  </div>
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isResearcher && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Shield className="w-3 h-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          {isResearcher ? <ChartLine className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="studies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{isResearcher ? 'Your Research Studies' : 'Active Research Studies'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isResearcher ? 'No Active Studies' : 'No Active Studies'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isResearcher 
                      ? 'Create your first research study to start analyzing data'
                      : 'Browse available research studies to start contributing your data'
                    }
                  </p>
                  <Button className="bg-gradient-to-r from-blue-600 to-teal-600">
                    {isResearcher ? 'Create Study' : 'Browse Studies'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-900">Maximum Privacy Protection</h3>
                        <p className="text-sm text-green-700">
                          {isResearcher 
                            ? 'All research data is protected with zero-knowledge proofs'
                            : 'Your data is protected with zero-knowledge proofs'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">256-bit</div>
                        <div className="text-xs text-green-700">Encryption</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <div className="text-xs text-green-700">Data Breaches</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">100%</div>
                        <div className="text-xs text-green-700">Anonymous</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import { Search, Filter, Calendar, User, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Breakthroughs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'genetics', label: 'Genetics' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'pharmacology', label: 'Pharmacology' }
  ];

  const breakthroughs = [
    {
      id: 1,
      title: 'AI-Driven Drug Discovery for Rare Diseases',
      description: 'Machine learning algorithms identified 847 potential compounds for rare disease treatment using anonymized patient data from the Cura platform.',
      industry: 'pharmacology',
      authors: [
        { name: 'Dr. Sarah Chen', avatar: '', initials: 'SC' },
        { name: 'Dr. Michael Rodriguez', avatar: '', initials: 'MR' },
        { name: 'Dr. Emily Watson', avatar: '', initials: 'EW' }
      ],
      publicationDate: '2024-01-15',
      journal: 'Nature Medicine',
      impact: '3x faster discovery timeline',
      researchPapers: [
        { title: 'Accelerated Drug Discovery Through Federated Learning', url: '#', type: 'Primary Research' },
        { title: 'Privacy-Preserving ML in Pharmaceutical Research', url: '#', type: 'Supporting Study' }
      ],
      articles: [
        { title: 'Revolutionary AI Approach Speeds Up Drug Discovery', url: '#', publication: 'Medical News Today' },
        { title: 'How Privacy-First Data Sharing Transforms Medicine', url: '#', publication: 'Science Daily' }
      ]
    },
    {
      id: 2,
      title: 'Early Cancer Detection Through Pattern Recognition',
      description: 'Advanced ML models detected early cancer biomarkers with 94.2% accuracy across diverse patient populations.',
      industry: 'oncology',
      authors: [
        { name: 'Dr. James Liu', avatar: '', initials: 'JL' },
        { name: 'Dr. Priya Patel', avatar: '', initials: 'PP' }
      ],
      publicationDate: '2024-02-08',
      journal: 'The Lancet Oncology',
      impact: '15 months earlier detection',
      researchPapers: [
        { title: 'Multi-Modal Biomarker Discovery in Early-Stage Cancer', url: '#', type: 'Primary Research' },
        { title: 'Population Diversity in Cancer Screening Models', url: '#', type: 'Methodology' }
      ],
      articles: [
        { title: 'AI Breakthrough Could Save Millions of Lives', url: '#', publication: 'Health Tech News' },
        { title: 'The Future of Cancer Screening is Here', url: '#', publication: 'Medical Tribune' }
      ]
    },
    {
      id: 3,
      title: 'Personalized Treatment Optimization',
      description: 'AI algorithms developed personalized therapy plans, reducing adverse drug reactions by 68% through analysis of genetic and lifestyle data.',
      industry: 'genetics',
      authors: [
        { name: 'Dr. Anna Kowalski', avatar: '', initials: 'AK' },
        { name: 'Dr. David Thompson', avatar: '', initials: 'DT' },
        { name: 'Dr. Lisa Chang', avatar: '', initials: 'LC' }
      ],
      publicationDate: '2024-03-12',
      journal: 'Nature Genetics',
      impact: '2.4x better patient outcomes',
      researchPapers: [
        { title: 'Genomic-Driven Personalized Medicine at Scale', url: '#', type: 'Primary Research' },
        { title: 'Reducing ADRs Through Predictive Modeling', url: '#', type: 'Clinical Study' }
      ],
      articles: [
        { title: 'Personalized Medicine Reaches New Heights', url: '#', publication: 'Genomics Today' },
        { title: 'AI-Powered Treatment Plans Show Promise', url: '#', publication: 'Clinical Research News' }
      ]
    },
    {
      id: 4,
      title: 'Novel Genetic Correlations in Population Health',
      description: 'Discovery of 23 novel genetic correlations leading to breakthrough preventive protocols and 40% risk reduction in target populations.',
      industry: 'genetics',
      authors: [
        { name: 'Dr. Robert Kim', avatar: '', initials: 'RK' },
        { name: 'Dr. Maria Gonzalez', avatar: '', initials: 'MG' }
      ],
      publicationDate: '2024-04-05',
      journal: 'American Journal of Human Genetics',
      impact: '40% risk reduction',
      researchPapers: [
        { title: 'Population-Scale Genetic Association Studies', url: '#', type: 'Primary Research' },
        { title: 'Preventive Genomics in Public Health', url: '#', type: 'Review' }
      ],
      articles: [
        { title: 'Genetic Research Unveils New Prevention Strategies', url: '#', publication: 'Public Health Weekly' },
        { title: 'The Genetics of Disease Prevention', url: '#', publication: 'Science Digest' }
      ]
    },
    {
      id: 5,
      title: 'Neurological Disorder Early Intervention',
      description: 'Machine learning models identified early markers for neurological disorders, enabling intervention 18 months before clinical symptoms appear.',
      industry: 'neurology',
      authors: [
        { name: 'Dr. Jennifer Adams', avatar: '', initials: 'JA' },
        { name: 'Dr. Thomas Mueller', avatar: '', initials: 'TM' }
      ],
      publicationDate: '2024-05-20',
      journal: 'Brain',
      impact: '18 months earlier intervention',
      researchPapers: [
        { title: 'Preclinical Markers of Neurodegeneration', url: '#', type: 'Primary Research' },
        { title: 'Early Intervention Strategies in Neurology', url: '#', type: 'Clinical Protocol' }
      ],
      articles: [
        { title: 'AI Predicts Neurological Disorders Before Symptoms', url: '#', publication: 'Neurology Today' },
        { title: 'Early Detection Revolution in Brain Health', url: '#', publication: 'Medical Innovation' }
      ]
    },
    {
      id: 6,
      title: 'Cardiac Risk Prediction Enhancement',
      description: 'Advanced analytics improved cardiac risk prediction accuracy by 85%, enabling targeted prevention strategies for high-risk patients.',
      industry: 'cardiology',
      authors: [
        { name: 'Dr. Ahmed Hassan', avatar: '', initials: 'AH' },
        { name: 'Dr. Sophie Martin', avatar: '', initials: 'SM' }
      ],
      publicationDate: '2024-06-10',
      journal: 'Circulation',
      impact: '85% improved accuracy',
      researchPapers: [
        { title: 'Multi-Factor Cardiac Risk Assessment Models', url: '#', type: 'Primary Research' },
        { title: 'Precision Cardiology Through Data Analytics', url: '#', type: 'Methodology' }
      ],
      articles: [
        { title: 'Heart Disease Prevention Gets Smarter', url: '#', publication: 'Cardiology News' },
        { title: 'AI Transforms Cardiac Care', url: '#', publication: 'Heart Health Today' }
      ]
    }
  ];

  const filteredBreakthroughs = breakthroughs.filter(breakthrough => {
    const matchesSearch = breakthrough.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         breakthrough.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || breakthrough.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Breakthrough Explorer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
        </div>

        <div className="grid gap-8">
          {filteredBreakthroughs.map((breakthrough) => (
            <Card key={breakthrough.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-gray-900 mb-2">
                      {breakthrough.title}
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 mb-4">
                      {breakthrough.description}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(breakthrough.publicationDate)}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{breakthrough.journal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      {breakthrough.impact}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Research Team
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {breakthrough.authors.map((author, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={author.avatar} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                            {author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-700">{author.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Research Papers</h4>
                    <div className="space-y-2">
                      {breakthrough.researchPapers.map((paper, index) => (
                        <a
                          key={index}
                          href={paper.url}
                          className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-blue-600">
                                {paper.title}
                              </p>
                              <p className="text-sm text-gray-500">{paper.type}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Articles & Coverage</h4>
                    <div className="space-y-2">
                      {breakthrough.articles.map((article, index) => (
                        <a
                          key={index}
                          href={article.url}
                          className="block p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-teal-600">
                                {article.title}
                              </p>
                              <p className="text-sm text-gray-500">{article.publication}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" className="w-full sm:w-auto">
                    View Full Research Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBreakthroughs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No breakthroughs found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filter settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Breakthroughs;

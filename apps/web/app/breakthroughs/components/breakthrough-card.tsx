import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, ExternalLink } from 'lucide-react';

export interface Breakthrough {
  id: number;
  title: string;
  description: string;
  industry: string;
  authors: {
    name: string;
    initials: string;
    avatar: string;
  }[];
  publicationDate: string;
  journal: string;
  impact: string;
  researchPapers: {
    title: string;
    url: string;
    type: string;
  }[];
  articles: {
    title: string;
    url: string;
    publication: string;
  }[];
}

interface BreakthroughCardProps {
  breakthrough: Breakthrough;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export function BreakthroughCard({ breakthrough }: BreakthroughCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl text-gray-900 mb-2">
              {breakthrough.title}
            </CardTitle>
            <CardDescription className="text-md sm:text-lg text-gray-600 mb-4">
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
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
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
      </CardContent>
    </Card>
  );
}

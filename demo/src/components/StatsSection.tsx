
import React from 'react';
import { TrendingUp, Users, Database, Shield, Brain, Microscope, Zap, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      value: '10,247',
      label: 'Active Contributors',
      change: '+12% this month',
      color: 'text-blue-600'
    },
    {
      icon: Database,
      value: '2.3M',
      label: 'Data Points Shared',
      change: '+45% this month',
      color: 'text-teal-600'
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Privacy Protected',
      change: 'Zero breaches',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      value: '$2.1M',
      label: 'Rewards Distributed',
      change: '+23% this month',
      color: 'text-purple-600'
    }
  ];

  const breakthroughs = [
    {
      icon: Brain,
      title: 'AI Drug Discovery',
      description: 'Identified 847 potential compounds for rare disease treatment using our anonymized patient data.',
      impact: '3x faster discovery',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Microscope,
      title: 'Pattern Recognition',
      description: 'ML models detected early cancer biomarkers with 94.2% accuracy across diverse populations.',
      impact: '15 months earlier detection',
      gradient: 'from-red-500 to-red-600'
    },
    {
      icon: Zap,
      title: 'Treatment Optimization',
      description: 'AI algorithms personalized therapy plans, reducing adverse reactions by 68%.',
      impact: '2.4x better outcomes',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Award,
      title: 'Population Health Insights',
      description: 'Discovered 23 novel genetic correlations leading to breakthrough preventive protocols.',
      impact: '40% risk reduction',
      gradient: 'from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Impact, Real Numbers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how our community is advancing medical research while maintaining complete privacy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-medium text-gray-700 mb-2">{stat.label}</div>
                  <div className="text-sm text-green-600 font-medium">{stat.change}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Powered Breakthroughs
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Leveraging anonymized datasets from our community, AI has unlocked unprecedented medical discoveries and accelerated research timelines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {breakthroughs.map((breakthrough, index) => {
            const Icon = breakthrough.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${breakthrough.gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{breakthrough.title}</h4>
                    <p className="text-gray-600 mb-3">{breakthrough.description}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${breakthrough.gradient} text-white`}>
                      <span>{breakthrough.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-3" asChild>
            <Link to="/breakthroughs">
              Explore More Breakthroughs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

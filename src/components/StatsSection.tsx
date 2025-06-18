
import React from 'react';
import { TrendingUp, Users, Database, Shield } from 'lucide-react';

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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      </div>
    </section>
  );
};

export default StatsSection;


import React from 'react';
import { Shield, Database, Users, Coins, Eye, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Privacy',
      description: 'Prove data ownership and eligibility without revealing sensitive information using advanced cryptographic proofs.',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Database,
      title: 'Decentralized Storage',
      description: 'Your data stays encrypted in your personal vault. Only ZK commitments are stored on-chain.',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      icon: Users,
      title: 'Research Matching',
      description: 'Advanced algorithms match your data with relevant research projects while maintaining complete anonymity.',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: Coins,
      title: 'Fair Compensation',
      description: 'Earn rewards for contributing to medical research through automated smart contract payments.',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Eye,
      title: 'Transparent Governance',
      description: 'Participate in DAO decisions about platform ethics, research approval, and protocol updates.',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: Lock,
      title: 'Consent Management',
      description: 'Granular control over how your data is used with easy-to-revoke permissions and clear terms.',
      gradient: 'from-red-500 to-red-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Privacy, Designed for Impact
          </h2>
          <p className="text-md sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge privacy technology with user-friendly design to create 
            the most secure and ethical medical data marketplace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
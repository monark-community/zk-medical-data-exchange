
import React from 'react';
import { Brain, Microscope, Zap, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const Breakthroughs = () => {
  const router = useRouter();

  // dummy values : change these informations once real data is available
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
    <section className="pb-20">
      <div className="container mx-auto px-10 sm:px-20">
        <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Breakthroughs
            </h3>
            <p className="text-md sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
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
                    <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{breakthrough.title}</h4>
                    <p className="text-sm md:text-md text-gray-600 mb-3">{breakthrough.description}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r ${breakthrough.gradient} text-white`}>
                      <span>{breakthrough.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-3"
            onClick={() => router.push("/breakthroughs")}
            size="lg"
          >
            <div>
              Explore More Breakthroughs
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Breakthroughs;
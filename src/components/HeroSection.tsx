
import React from 'react';
import { Shield, Database, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useLocalization } from '@/contexts/LocalizationContext';

const HeroSection = () => {
  const navigate = useNavigate();
  const { handleConnectWallet } = useWallet();
  const { t } = useLocalization();

  const handleConnectData = () => {
    handleConnectWallet();
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHowItWorks = () => {
    navigate('/how-it-works');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    t('hero.feature1'),
    t('hero.feature2'),
    t('hero.feature3'),
    t('hero.feature4')
  ];

  const stats = [
    { value: '10K+', label: t('hero.stats.contributors') },
    { value: '500+', label: t('hero.stats.projects') },
    { value: '$2M+', label: t('hero.stats.rewards') },
    { value: '99.9%', label: t('hero.stats.privacy') }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-teal-200 rounded-full opacity-20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-200 to-blue-200 rounded-full opacity-20 blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            {t('hero.badge')}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('hero.title')}
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-3" onClick={handleConnectData}>
              {t('hero.connectData')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-500 px-8 py-3" onClick={handleHowItWorks}>
              {t('hero.howItWorks')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-left">{feature}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

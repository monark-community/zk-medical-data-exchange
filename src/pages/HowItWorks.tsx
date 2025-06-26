
import React from 'react';
import { Shield, Users, Lock, Zap, Database, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

const HowItWorks = () => {
  const navigate = useNavigate();
  const { handleConnectWallet } = useWallet();

  const handleConnectWalletClick = () => {
    handleConnectWallet();
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Technology',
      description: 'A secure, transparent, and decentralized ledger that ensures data integrity and trust without intermediaries.',
      details: ['Immutable record keeping', 'Transparent transactions', 'Decentralized network']
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Proofs',
      description: 'Advanced cryptography that allows verification of data without revealing the actual information.',
      details: ['Privacy-preserving verification', 'Secure computation', 'Anonymous validation']
    },
    {
      icon: Database,
      title: 'Digital Wallets',
      description: 'Your secure digital identity that manages your data, tokens, and interactions on the blockchain.',
      details: ['Secure key management', 'Identity verification', 'Transaction control']
    }
  ];

  const researcherBenefits = [
    'Access to diverse, high-quality medical datasets',
    'Verify data authenticity and integrity',
    'Collaborate globally with privacy guarantees',
    'Accelerate research with AI-powered insights',
    'Publish findings with immutable proof'
  ];

  const patientBenefits = [
    'Maintain complete control over your health data',
    'Earn rewards for contributing to medical research',
    'Privacy-first data sharing with zero-knowledge proofs',
    'Help advance medical breakthroughs',
    'Transparent compensation for data contribution'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Hero Section with Background Image */}
      <section 
        className="py-20 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            How Cura Works
          </h1>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto mb-8 drop-shadow-md">
            Understanding the technology that powers secure, privacy-preserving medical research collaboration
          </p>
        </div>
      </section>

      {/* Technology Fundamentals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Technology Fundamentals</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Researchers */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold">For Researchers</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4">Transform Your Research</h3>
                <p className="text-gray-600 mb-6">
                  Access verified medical data while maintaining patient privacy. Collaborate globally 
                  with confidence in data integrity and authenticity.
                </p>
                <ul className="space-y-3">
                  {researcherBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h4 className="font-semibold mb-4">Research Workflow</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">1</span>
                    </div>
                    <span className="text-sm">Connect your research wallet</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">2</span>
                    </div>
                    <span className="text-sm">Browse verified datasets</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Analyze with privacy guarantees</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">4</span>
                    </div>
                    <span className="text-sm">Publish breakthrough findings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Patients */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold">For Medical Patients</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h4 className="font-semibold mb-4">Your Data Journey</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-teal-600">1</span>
                      </div>
                      <span className="text-sm">Set up your secure wallet</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-teal-600">2</span>
                      </div>
                      <span className="text-sm">Choose what data to share</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-teal-600">3</span>
                      </div>
                      <span className="text-sm">Earn rewards for contributions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-teal-600">4</span>
                      </div>
                      <span className="text-sm">Track research impact</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-xl font-semibold mb-4">Your Data, Your Control</h3>
                <p className="text-gray-600 mb-6">
                  Share your health data securely while maintaining complete privacy and control. 
                  Contribute to medical breakthroughs and earn rewards for your valuable contributions.
                </p>
                <ul className="space-y-3">
                  {patientBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join the future of medical research with secure, privacy-preserving data collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => {
                navigate('/research');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Explore Research
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-700 hover:bg-blue-800 text-white"
              onClick={handleConnectWalletClick}
            >
              Connect Your Wallet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;

"use client";

import React from 'react';
import CustomNavbar from '@/components/navigation/customNavBar';
import Footer from '@/components/footer';
import HowItWorksHero from './components/how-it-works-hero';
import HowItWorksFeatures from './components/how-it-works-features';
import HowItWorksForResearchers from './components/how-it-works-for-researchers';
import HowItWorksForPatients from './components/how-it-works-for-patients';
import HowItWorksCallToAction from './components/how-it-works-call-to-action';

const HowItWorks = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <CustomNavbar />
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <HowItWorksHero />
        <HowItWorksFeatures />
        <HowItWorksForResearchers />
        <HowItWorksForPatients />
        <HowItWorksCallToAction />
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;
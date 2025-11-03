"use client";

import React from "react";
import CustomNavbar from "@/components/navigation/customNavBar";
import Hero from "@/app/landing/components/hero";
import Features from "@/app/landing/components/features";
import Statistics from "@/app/landing/components/statistics";
import Breakthroughs from "@/app/landing/components/breakthroughs";
import Footer from "@/components/footer";

export default function LandingPage() {
  return (
    <div>
      <CustomNavbar />
      <Hero />
      <Features />
      <div className=" bg-gradient-to-br from-gray-50 to-white">
        <Statistics />
        <Breakthroughs />
      </div>
      <Footer />
    </div>
  );
}
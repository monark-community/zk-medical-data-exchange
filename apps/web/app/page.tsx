"use client";

import React from "react";
import CustomNavbar from "@/components/navigation/customNavBar";
import Hero from "@/app/landing/components/hero";
import Features from "@/app/landing/components/features";
import Statistics from "@/app/landing/components/statistics";

export default function LandingPage() {
  return (
    <div>
      <CustomNavbar />
      <Hero />
      <Features />
      <Statistics />
    </div>
  );
}
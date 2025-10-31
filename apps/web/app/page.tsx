"use client";

import React from "react";
import CustomNavbar from "@/components/navigation/customNavBar";
import Hero from "@/app/landing/components/hero";
import Features from "@/app/landing/components/features";

export default function LandingPage() {
  return (
    <div>
      <CustomNavbar />
      <Hero />
      <div className="mx-5 sm:mx-20">
        <Features />
      </div>
    </div>
  );
}
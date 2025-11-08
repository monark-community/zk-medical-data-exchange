"use client";

import CustomNavbar from "@/components/navigation/customNavBar";
import React from "react";
import GovernanceOverview from "@/app/governance/components//GovernanceOverview";
import GovernanceTabs from "@/app/governance/components/GovernanceTabs";

export default function Governance() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />
      <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-8">
        <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="title mb-8">
            <p className="text-3xl font-bold text-gray-900 mb-2">DAO Governance</p>
            <p className="text-gray-600">
              Participate in platform governance and shape the future of Cura
            </p>
          </div>
          <div className="summarySection ">
            <GovernanceOverview />
          </div>
          <div className="tabSection ">
            <GovernanceTabs />
          </div>
        </div>
      </main>
    </div>
  );
}

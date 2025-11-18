"use client";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GOVERNANCE_OVERVIEW_UI } from "@/app/governance/constants/UI";
import { useGovernance } from "@/hooks/useGovernance";

const ui = GOVERNANCE_OVERVIEW_UI;
const GovernanceOverview = () => {
  const { stats, isLoading } = useGovernance();
  console.log("Governance stats in component:", stats);
  const governanceStats = {
    totalProposals: stats?.totalProposals ?? 0,
    nbActiveVoters: stats?.uniqueVoters ?? 0,
    avgParticipationPercentage: (stats?.avgParticipation ?? 0) + "%",
    votingPower: stats?.votingPower ?? 0,
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {Object.keys(ui).map((key) => (
          <Card key={key} className="rounded-lg border bg-card animate-pulse">
            <CardHeader className="flex items-center align-center justify-center h-16" />
            <CardContent className="justify-center h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {Object.entries(governanceStats).map(([key, value]) => {
        const uiKey = key as keyof typeof ui;
        return (
          <Card
            key={key}
            className={`rounded-lg border bg-card justify-center text-card-foreground shadow-sm bg-gradient-to-br ${ui[uiKey].color}`}
          >
            <CardHeader className="flex items-center align-center justify-center ">
              {ui[uiKey].icon1 &&
                React.createElement(require("lucide-react")[ui[uiKey].icon1], {
                  className: `w-8 h-8 ${ui[uiKey].icon1Color}`,
                })}
            </CardHeader>
            <CardContent className="justify-center">
              <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{ui[uiKey].title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GovernanceOverview;

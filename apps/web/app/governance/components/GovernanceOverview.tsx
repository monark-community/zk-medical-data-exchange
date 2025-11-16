"use client";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GOVERNANCE_OVERVIEW_UI } from "@/app/governance/constants/UI";

// TODO fetch real data from backend
const governanceInfo = {
  totalProposals: 47,
  nbActiveVoters: 12543,
  avgParticipationPercentage: 78 + "%",
  votingPower: 5.4 + "M", //quantité de vote totale?
};

const ui = GOVERNANCE_OVERVIEW_UI;
const GovernanceOverview = () => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {Object.entries(governanceInfo).map(([key, value]) => {
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

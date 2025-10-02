"use client";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACCOUNT_OVERVIEW_UI } from "@/app/dashboard/constants/UI";

// TODO fetch real data from backend
const accountInfo = {
  totalEarned: "$" + 245.8,
  nbDataPointsShared: 1247,
  nbActiveStudies: 5,
  privacyScore: 100 + "%",
};

const ui = ACCOUNT_OVERVIEW_UI;
const AccountOverview = () => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {Object.entries(accountInfo).map(([key, value]) => {
        const uiKey = key as keyof typeof ui;
        return (
          <Card
            key={key}
            className={`rounded-lg border bg-card text-card-foreground shadow-sm bg-gradient-to-br ${ui[uiKey].color}`}
          >
            <CardHeader className="flex items-center justify-between ">
              {ui[uiKey].icon1 &&
                React.createElement(require("lucide-react")[ui[uiKey].icon1], {
                  className: `w-8 h-8 ${ui[uiKey].icon1Color}`,
                })}
              {ui[uiKey].icon2 &&
                React.createElement(require("lucide-react")[ui[uiKey].icon2], {
                  className: `w-5 h-5 ${ui[uiKey].icon2Color}`,
                })}
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{ui[uiKey].title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AccountOverview;

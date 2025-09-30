"use client";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

// TODO fetch real data from backend
const accountInfo = {
  totalEarned: "$" + 245.8,
  nbDataPointsShared: 1247,
  nbActiveStudies: 5,
  privacyScore: 100 + "%",
};

const ui = {
  totalEarned: {
    icon1: "Coins",
    icon1Color: "text-blue-600",
    icon2: "TrendingUp",
    icon2Color: "text-green-600",
    title: "Total Earned",
    color: "from-blue-50 to-blue-100 border-blue-200",
  },
  nbDataPointsShared: {
    icon1: "Database",
    icon1Color: "text-teal-600",
    icon2: "Activity",
    icon2Color: "text-green-600",
    title: "Data Points Shared",
    color: "from-teal-50 to-teal-100 border-teal-200",
  },
  nbActiveStudies: {
    icon1: "BookOpenText",
    icon1Color: "text-purple-600",
    icon2: "RefreshCcw",
    icon2Color: "text-green-600",
    title: "Active Studies",
    color: "from-purple-50 to-purple-100 border-purple-200",
  },
  privacyScore: {
    icon1: "ShieldCheck",
    icon1Color: "text-green-600",
    icon2: "Lock",
    icon2Color: "text-green-600",
    title: "Privacy Score",
    color: "from-green-50 to-green-100 border-green-200",
  },
};
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

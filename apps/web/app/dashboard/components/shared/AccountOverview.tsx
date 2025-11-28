"use client";
import React, { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACCOUNT_OVERVIEW_UI } from "@/app/dashboard/constants/UI";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@zk-medical/shared";
import { getUserStats, DataSellerStats, ResearcherStats } from "@/services/api/userService";
import { Spinner } from "@/components/ui/spinner";
import eventBus from "@/lib/eventBus";

interface AccountOverviewProps {
  walletAddress: string;
}

const AccountOverview: React.FC<AccountOverviewProps> = ({ walletAddress }) => {
  const { currentProfile } = useProfile();
  const [stats, setStats] = useState<DataSellerStats | ResearcherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      console.log("Fetching user stats for wallet:", walletAddress, "and profile:", currentProfile);
      try {
        setLoading(true);
        const data = await getUserStats(walletAddress, currentProfile);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      } finally {
        setLoading(false);
      }
    };

    eventBus.on("medicalDataUploaded", fetchStats);
    eventBus.on("medicalDataDeleted", fetchStats);
    eventBus.on("studyCreated", fetchStats);
    eventBus.on("studyCompleted", fetchStats);
    eventBus.on("studyJoinedSuccess", fetchStats);
    eventBus.on("studyDeleted", fetchStats);
    eventBus.on("consentChanged", fetchStats);

    if (walletAddress) {
      fetchStats();
    }

    return () => {
      eventBus.off("medicalDataUploaded", fetchStats);
      eventBus.off("medicalDataDeleted", fetchStats);
      eventBus.off("studyCreated", fetchStats);
      eventBus.off("studyCompleted", fetchStats);
      eventBus.off("studyJoinedSuccess", fetchStats);
      eventBus.off("studyDeleted", fetchStats);
      eventBus.off("consentChanged", fetchStats);
    };
  }, [walletAddress, currentProfile]);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-blue-600" />
      </div>
    );
  }

  const getAccountInfo = () => {
    if (!stats) return null;

    if (currentProfile === UserProfile.DATA_SELLER) {
      const dataSellerStats = stats as DataSellerStats;
      return {
        totalEarned: "$" + (dataSellerStats.totalEarnings ?? 0).toFixed(2),
        nbDataPointsShared: dataSellerStats.nMedicalFiles ?? 0,
        nbActiveStudies: dataSellerStats.nActiveStudies ?? 0,
        nbCompletedStudies: dataSellerStats.nCompletedStudies ?? 0,
      };
    } else if (currentProfile === UserProfile.RESEARCHER) {
      const researcherStats = stats as ResearcherStats;
      return {
        totalSpent: "$" + (researcherStats.totalSpent ?? 0).toFixed(2),
        nbParticipants: researcherStats.nParticipantsEnrolled ?? 0,
        nbActiveStudies: researcherStats.nActiveStudies ?? 0,
        nbCompletedStudies: researcherStats.nCompletedStudies ?? 0,
      };
    }
    return null;
  };

  const accountInfo = getAccountInfo();

  if (!accountInfo) {
    return null;
  }

  const ui =
    currentProfile === UserProfile.DATA_SELLER
      ? ACCOUNT_OVERVIEW_UI.dataSeller
      : ACCOUNT_OVERVIEW_UI.researcher;

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {Object.entries(accountInfo).map(([key, value]) => {
        const uiKey = key as keyof typeof ui;
        if (!ui[uiKey]) return null;

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

"use client";

import { useAuthRedirect } from "@/hooks/useAuth";

import CustomNavbar from "@/components/navigation/customNavBar";
import { useAccount } from "wagmi";
import { useAESKey } from "@/hooks/useAESKey";
import DashboardTabs from "./components/shared/DashboardTabs";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@zk-medical/shared";
import AccountOverview from "./components/shared/AccountOverview";

export default function Dashboard() {
  const { isConnected } = useAuthRedirect();
  const account = useAccount();
  const { aesKey } = useAESKey(account);
  const { currentProfile } = useProfile();

  if (!isConnected) {
    return null;
  }

  const getDashboardTitle = () => {
    if (currentProfile === UserProfile.RESEARCHER) {
      return {
        title: "Research Dashboard",
        subtitle: "Access datasets and manage your research projects",
      };
    }
    return {
      title: "Your Health Data Dashboard",
      subtitle: "Manage your data contributions and track rewards",
    };
  };

  const { title, subtitle } = getDashboardTitle();

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />

      <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-8">
        <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="title mb-8">
            <p className="text-3xl font-bold text-gray-900 mb-2">{title}</p>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <div className="summarySection ">
            <AccountOverview walletAddress={account.address || ""} />
          </div>
          <div className="tabSection ">
            <DashboardTabs aesKey={aesKey} account={account} />
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

<<<<<<< HEAD
import { useProtectedRoute } from "@/hooks/useAuth";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
=======
import { useAuthRedirect } from "@/hooks/useAuth";

import CustomNavbar from "@/components/navigation/customNavBar";
>>>>>>> 933068f8a3c783ff01afb7216e947456bac9aa27
import { useAccount } from "wagmi";
import { useAESKey } from "@/hooks/useAESKey";
import DashboardTabs from "./components/shared/DashboardTabs";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@zk-medical/shared";
import AccountOverview from "./components/shared/AccountOverview";

export default function Dashboard() {
<<<<<<< HEAD
  const { isConnected } = useProtectedRoute();
  const { disconnect } = useWeb3AuthDisconnect();
=======
  const { isConnected } = useAuthRedirect();
>>>>>>> 933068f8a3c783ff01afb7216e947456bac9aa27
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
<<<<<<< HEAD
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Cura Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {account.status === "connected"
                  ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                  : "No wallet connected"}
              </span>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <FilesSection aesKey={aesKey} walletAddress={account.address} />
        <UploadSection account={account} aesKey={aesKey} />
=======
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
>>>>>>> 933068f8a3c783ff01afb7216e947456bac9aa27
      </main>
    </div>
  );
}

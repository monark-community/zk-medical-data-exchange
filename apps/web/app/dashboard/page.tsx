"use client";

import { useProtectedRoute } from "@/hooks/useAuth";
import CustomNavbar from "@/components/navigation/customNavBar";
import { useAccount } from "wagmi";
import { useAESKey } from "@/hooks/useAESKey";
import AccountOverview from "./components/AccountOverview";
import DashboardTabs from "./components/DashboardTabs";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const account = useAccount();
  const { aesKey } = useAESKey(account);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />

      <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-8">
        <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="title mb-8">
            <p className="text-3xl font-bold text-gray-900 mb-2">Your Health Data Dashboard</p>
            <p className="text-gray-600">Manage your data contributions and track rewards</p>
          </div>
          <div className="summarySection ">
            <AccountOverview />
          </div>
          <div className="tabSection ">
            <DashboardTabs aesKey={aesKey} account={account} />
          </div>
        </div>
      </main>
    </div>
  );
}

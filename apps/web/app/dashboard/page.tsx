"use client";

import { useProtectedRoute } from "@/hooks/useAuth";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { useAESKey } from "@/hooks/useAESKey";
import AccountOverview from "./components/dataSeller/AccountOverview";
import DashboardTabs from "./components/shared/DashboardTabs";

export default function Dashboard() {
  const { isConnected } = useProtectedRoute();
  const { disconnect } = useWeb3AuthDisconnect();
  const account = useAccount();
  const { aesKey } = useAESKey(account);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      </main>
    </div>
  );
}

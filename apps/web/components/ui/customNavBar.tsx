"use client";
import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";

export default function CustomNavbar() {
  const { disconnect } = useWeb3AuthDisconnect();
  const { address } = useAccount();
  let isCurrentlyDashboard = usePathname() === "/dashboard";
  let isCurrentlyGovernance = usePathname() === "/governance";
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Cura</h1>
          </div>
          <div className="flex items-center justify-between min-w-[250]">
            <Button
              className="text-md"
              variant={isCurrentlyDashboard ? "outline" : "ghost"}
              size="lg"
            >
              <Users /> Dashboard
            </Button>
            <Button
              className="text-md"
              variant={isCurrentlyGovernance ? "outline" : "ghost"}
              size="lg"
            >
              Governance
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet connected"}
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
  );
}

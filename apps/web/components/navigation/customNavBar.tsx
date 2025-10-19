"use client";
import React from "react";
import { Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

import { usePathname, useRouter } from "next/navigation";
import UserMenu from "./userMenu";

const CustomNavbar = () => {
  let isCurrentlyDashboard = usePathname() === "/dashboard";
  let isCurrentlyGovernance = usePathname() === "/governance";
  const router = useRouter();
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent ml-2">
              Cura
            </h1>
          </div>
          <div className="flex items-center justify-between min-w-[300]">
            <Button
              className="text-md"
              variant={isCurrentlyDashboard ? "outline" : "ghost"}
              size="lg"
              onClick={() => router.push("/dashboard")}
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

          <UserMenu />
        </div>
      </div>
    </nav>
  );
};
export default CustomNavbar;

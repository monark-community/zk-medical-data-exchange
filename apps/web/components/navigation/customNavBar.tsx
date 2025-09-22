"use client";
import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

import { usePathname } from "next/navigation";
import UserMenu from "./userMenu";

const CustomNavbar = () => {
  let isCurrentlyDashboard = usePathname() === "/dashboard";
  let isCurrentlyGovernance = usePathname() === "/governance";
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className=" container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Cura</h1>
          </div>
          <div className="flex items-center justify-between min-w-[300]">
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

          <UserMenu />
        </div>
      </div>
    </nav>
  );
};
export default CustomNavbar;

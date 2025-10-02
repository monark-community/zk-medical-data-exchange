"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LogOut, User, Settings } from "lucide-react";

import { useAccount } from "wagmi";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { logout } from "@/services/authService";
import { useRouter } from "next/navigation";

const UserMenu = () => {
  const { address } = useAccount();
  const { disconnect } = useWeb3AuthDisconnect();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Call logout service to clear JWT token
      await logout();
      
      // Disconnect wallet
      disconnect();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout API fails, still disconnect locally
      disconnect();
      router.push('/');
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <span className="relative flex shrink-0 overflow-hidden rounded-full w-6 h-6">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs bg-gradient-to-br from-blue-500 to-teal-500 text-white">
              MC
            </span>
          </span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Monark Cura</span>
            <span className="text-xs text-gray-500">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet connected"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Data Seller view</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-700" onClick={handleLogout}>
          <LogOut className="text-red-700" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

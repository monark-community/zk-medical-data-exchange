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
import { useAccount } from "wagmi";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
const UserMenu = () => {
  const { address } = useAccount();
  const { disconnect } = useWeb3AuthDisconnect();
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
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

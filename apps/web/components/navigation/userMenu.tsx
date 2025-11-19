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

import { LogOut, User, RefreshCw } from "lucide-react";

import { useAccount } from "wagmi";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@zk-medical/shared";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import WalletAvatar from "@/components/walletAvatar";

const UserMenu = () => {
  const { address } = useAccount();
  const { disconnect } = useWeb3AuthDisconnect();
  const { currentProfile, setProfile, getProfileDisplayName } = useProfile();
  const { user } = useUser();
  const router = useRouter();

  const handleProfileSwitch = () => {
    const newProfile =
      currentProfile === UserProfile.DATA_SELLER ? UserProfile.RESEARCHER : UserProfile.DATA_SELLER;
    setProfile(newProfile);
  };

  const getOtherProfileName = () => {
    return currentProfile === UserProfile.DATA_SELLER ? "Researcher" : "Data Seller";
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="overflow-visible">
          <WalletAvatar address={address} size={32} className="mr-3" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{user.username}</span>
            <span className="text-xs text-gray-500">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet connected"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Current view: {getProfileDisplayName(currentProfile)}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleProfileSwitch}>
            <RefreshCw />
            Switch to {getOtherProfileName()}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-700" onClick={() => disconnect()}>
          <LogOut className="text-red-700" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

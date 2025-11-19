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

const getGradientColors = (address: string | undefined) => {
  if (!address) return "from-blue-700 via-indigo-600 to-teal-600";

  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash + address.charCodeAt(i)) & 0xffffffff;
  }

  const gradients = [
    "from-emerald-700 via-green-600 to-teal-600", // Green theme
    "from-blue-700 via-indigo-600 to-cyan-600", // Blue theme
    "from-purple-700 via-violet-600 to-indigo-600", // Purple theme
    "from-rose-700 via-pink-600 to-purple-600", // Pink theme
    "from-amber-700 via-orange-600 to-red-600", // Orange theme
    "from-teal-700 via-cyan-600 to-blue-600", // Teal theme
    "from-indigo-700 via-purple-600 to-pink-600", // Indigo theme
    "from-green-700 via-emerald-600 to-cyan-600", // Green-cyan theme
    "from-violet-700 via-purple-600 to-indigo-600", // Violet theme
    "from-cyan-700 via-blue-600 to-teal-600", // Cyan theme
    "from-lime-700 via-green-600 to-emerald-600", // Lime theme
    "from-sky-700 via-blue-600 to-indigo-600", // Sky theme
  ];

  return gradients[Math.abs(hash) % gradients.length];
};

const AnimatedRobotAvatar = ({ size = 32 }: { size?: number }) => {
  const { address } = useAccount();

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Robot Head */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientColors(
          address
        )} rounded-full border-2 border-white/50 shadow-lg`}
      >
        {/* Eyes */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-pulse shadow-sm"></div>
        <div
          className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-pulse shadow-sm"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Mouth/Screen */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-white/90 rounded-full shadow-sm"></div>

        {/* Antenna */}
        <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-white/70 rounded-full shadow-sm"></div>
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full animate-ping shadow-lg"></div>
      </div>

      {/* Robot Body */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-gradient-to-br from-gray-200 to-gray-400 rounded-lg border border-white/30 shadow-lg">
        {/* Chest Panel */}
        <div className="absolute inset-0.5 bg-gradient-to-br from-white/20 to-white/10 rounded border border-white/20">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Arms */}
      <div className="absolute top-5 left-0.5 w-2 h-4 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full transform -rotate-12 animate-wave origin-top shadow-md"></div>
      <div
        className="absolute top-5 right-0.5 w-2 h-4 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full transform rotate-12 animate-wave origin-top shadow-md"
        style={{ animationDelay: "1s" }}
      ></div>
    </div>
  );
};

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
        <Button variant="outline">
          <AnimatedRobotAvatar size={32} />
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

// CSS Animations for Animated Robot Character
const styles = `
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }

  .animate-wave {
    animation: wave 2s ease-in-out infinite;
  }
`;

// Inject styles into head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

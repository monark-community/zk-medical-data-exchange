"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCardProps } from "@/interfaces/profile";
import { useProfile } from "@/contexts/ProfileContext";
import { getUser } from "@/services/api/userService";
import { useAccount } from "wagmi";
import { User } from "@/interfaces/user";
import EditProfileDialog from "./editProfileDialog";

const ProfileCard = () => {
  const formatWalletAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  const { currentProfile, getProfileDisplayName } = useProfile();
  const { address } = useAccount();
  const [user, setUser] = React.useState<User>({ id: "", username: "", createdAt: "" });
  const [profileCardInfo, setProfileCardInfo] = React.useState<ProfileCardProps | null>(null);

  const fetchUserData = React.useCallback(async () => {
    if (!address) return;

    try {
      const userData = await getUser(address);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [address]);

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  React.useEffect(() => {
    if (user) {
      setProfileCardInfo({
        walletAddress: user.id,
        userAlias: user.username,
        accountType: getProfileDisplayName(currentProfile),
        createdAt: user.createdAt,
        dataContributions: 12,
        earnings: 247.5,
        privacyScore: 100,
      });
    }
  }, [user, currentProfile, getProfileDisplayName]);

  if (!profileCardInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="overflow-hidden py-0">
        {/* Header Section with Gradient */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-white">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>MC</AvatarFallback>
            </Avatar>
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 break-words break-all">
                {profileCardInfo.userAlias}
              </h1>
              <p className="text-blue-100 mb-3">
                {formatWalletAddress(profileCardInfo.walletAddress || "")}
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  {profileCardInfo.accountType}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-500/80 text-white hover:bg-green-500"
                >
                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                  Connected
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Account Settings */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    Wallet Address
                  </label>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded break-all font-mono">
                    {profileCardInfo.walletAddress}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    User Alias
                  </label>
                  <p className="text-gray-800">{profileCardInfo.userAlias}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    Account Type
                  </label>
                  <p className="text-gray-800">{profileCardInfo.accountType}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Activity Summary */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Activity Summary</h2>
              </div>

              <div className="space-y-4">
                {/* Data Contributions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Data Contributions</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {profileCardInfo.dataContributions}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">Datasets shared</p>
                </div>

                {/* Earnings */}
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-teal-700 mb-1">Earnings</p>
                  <p className="text-3xl font-bold text-teal-600">
                    ${(profileCardInfo.earnings ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-teal-600 mt-1">Total rewards earned</p>
                </div>

                {/* Privacy Score */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-green-700 mb-1">Privacy Score</p>
                  <p className="text-3xl font-bold text-green-600">
                    {profileCardInfo.privacyScore}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">Data always protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <EditProfileDialog onProfileUpdate={fetchUserData} />
            <Button variant="outline">Privacy Settings</Button>
            <Button variant="outline">Download Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;

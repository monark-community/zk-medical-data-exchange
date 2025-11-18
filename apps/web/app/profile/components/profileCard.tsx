"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity, ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";

import { ProfileCardProps } from "@/interfaces/profile";
import { useProfile } from "@/contexts/ProfileContext";
import { getUser } from "@/services/api/userService";
import { useAccount } from "wagmi";
import EditProfileDialog from "./editProfileDialog";
import { useUser } from "@/hooks/useUser";
import ProfileAvatar from "@/components/profileAvatar";
import { getTransactionByWalletAddress } from "@/services/api/transactionService";
import { Transaction } from "@/interfaces/transaction";
import { useTxStatusState } from "@/hooks/useTxStatus";

const ProfileCard = () => {
  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatUsd = (n: number | string) =>
    `$${Number(n ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const { currentProfile, getProfileDisplayName } = useProfile();
  const { address } = useAccount();
  const { user, refetchUser } = useUser();
  const { isVisible } = useTxStatusState();

  const [profileCardInfo, setProfileCardInfo] = React.useState<ProfileCardProps | null>(null);
  const [isWaitingForExportData, setIsWaitingForExportData] = React.useState(false);

  const [txs, setTxs] = React.useState<Transaction[]>([]);
  const [txsLoading, setTxsLoading] = React.useState(false);
  const [txsError, setTxsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || !address) return;

      try {
        setTxsLoading(true);
        setTxsError(null);

        const transactions: Transaction[] = await getTransactionByWalletAddress(
          address as `0x${string}`
        );

        const earnings = transactions.reduce((sum, tx) => {
          return tx.toWallet?.toLowerCase() === address.toLowerCase()
            ? sum + Number(tx.valueUsd ?? 0)
            : sum;
        }, 0);

        transactions.sort((a, b) => {
          const ta = new Date(a.createdAt).getTime();
          const tb = new Date(b.createdAt).getTime();
          return tb - ta;
        });

        setTxs(transactions);

        setProfileCardInfo({
          walletAddress: user.id,
          userAlias: user.username,
          accountType: getProfileDisplayName(currentProfile),
          createdAt: user.createdAt,
          earnings,
          privacyScore: 100,
        });
      } catch (e: any) {
        console.error("Failed to fetch transactions:", e);
        setTxsError(e?.message ?? "Failed to load transactions");
      } finally {
        setTxsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, address, currentProfile, getProfileDisplayName]);

  const exportUserData = async () => {
    if (!address) return;

    try {
      setIsWaitingForExportData(true);
      const userData = await getUser(address);
      const json = JSON.stringify(userData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "user_data.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export user data:", error);
    } finally {
      setIsWaitingForExportData(false);
    }
  };

  if (!profileCardInfo) {
    return <div>Loading...</div>;
  }

  const viewerWallet = address?.toLowerCase() ?? "";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden py-0">
        {/* Header Section with Gradient */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-white">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <ProfileAvatar size={96} radius={48} />
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
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    Account Creation Date
                  </label>
                  <p className="text-gray-800">{profileCardInfo.createdAt}</p>
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
                {/* Earnings */}
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-teal-700 mb-1">Earnings</p>
                  <p className="text-3xl font-bold text-teal-600">
                    {formatUsd(profileCardInfo.earnings ?? 0)}
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
            <EditProfileDialog onProfileUpdate={refetchUser} isProcessing={isVisible} />
            <Button variant="outline" disabled>
              Privacy Settings
            </Button>
            <Button variant="outline" disabled={isWaitingForExportData} onClick={exportUserData}>
              {isWaitingForExportData ? "Exporting..." : "Download Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="p-6">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <p className="text-sm text-muted-foreground">Payments you've sent or received on-chain</p>
        </CardHeader>
        <CardContent className="p-0">
          {txsLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading transactions…</div>
          ) : txsError ? (
            <div className="p-6 text-sm text-red-600">Error: {txsError}</div>
          ) : txs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            // 👇 scrollable wrapper
            <div className="max-h-80 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-t sticky top-0">
                  <tr className="text-left text-gray-600">
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Amount (USD)</th>
                    <th className="py-3 px-4">Study</th>
                    <th className="py-3 px-4">Tx Hash</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => {
                    const incoming = tx.toWallet?.toLowerCase() === viewerWallet;
                    const dirIcon = incoming ? (
                      <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-rose-600" />
                    );

                    return (
                      <tr key={tx.id} className="border-t">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {dirIcon}
                            <span className={incoming ? "text-emerald-700" : "text-rose-700"}>
                              {incoming ? "Incoming" : "Outgoing"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {incoming
                              ? `From ${formatWalletAddress(tx.fromWallet)}`
                              : `To ${formatWalletAddress(tx.toWallet)}`}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatUsd(tx.valueUsd ?? 0)}</td>
                        <td className="py-3 px-4">#{tx.studyId}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              window.open(
                                `https://sepolia.etherscan.io/tx/${tx.transactionHash}`,
                                "_blank",
                                "noopener"
                              )
                            }
                            className="font-mono text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                            title={tx.transactionHash}
                          >
                            {tx.transactionHash.slice(0, 10)}…
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="py-3 px-4">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;

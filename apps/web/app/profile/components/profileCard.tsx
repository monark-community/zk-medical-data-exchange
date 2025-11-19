"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";

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
  const [isExportingProfile, setIsExportingProfile] = React.useState(false);
  const [isExportingTransactions, setIsExportingTransactions] = React.useState(false);

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

  const downloadJsonFile = (fileName: string, payload: unknown) => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportProfileSnapshot = async () => {
    if (!address) return;
    try {
      setIsExportingProfile(true);
      const userData = await getUser(address);
      downloadJsonFile("profile_snapshot.json", {
        exportedAt: new Date().toISOString(),
        user: userData,
      });
    } catch (error) {
      console.error("Failed to export profile data:", error);
    } finally {
      setIsExportingProfile(false);
    }
  };

  const exportTransactionLedger = async () => {
    try {
      setIsExportingTransactions(true);
      downloadJsonFile("transaction_ledger.json", {
        exportedAt: new Date().toISOString(),
        transactions: txs,
      });
    } catch (error) {
      console.error("Failed to export transactions:", error);
    } finally {
      setIsExportingTransactions(false);
    }
  };

  if (!profileCardInfo) {
    return <div>Loading...</div>;
  }

  const viewerWallet = address?.toLowerCase() ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="overflow-hidden !py-0">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-500 to-teal-500 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProfileAvatar size={96} radius={48} />
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="break-words text-3xl font-bold sm:text-4xl">
                  {profileCardInfo.userAlias?.startsWith("0x")
                    ? formatWalletAddress(profileCardInfo.userAlias)
                    : profileCardInfo.userAlias}
                </h1>
              </div>
              <p className="text-sm font-mono text-white/80 break-all">
                {profileCardInfo.walletAddress}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/80 text-white hover:bg-emerald-500"
                >
                  <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-white" />
                  Connected
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/80">Earnings</p>
              <p className="text-2xl font-semibold">{formatUsd(profileCardInfo.earnings ?? 0)}</p>
              <p className="text-xs text-white/70">Total rewards</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/80">Privacy Score</p>
              <p className="text-2xl font-semibold">{profileCardInfo.privacyScore}%</p>
              <p className="text-xs text-white/70">All your data remained private</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/80">Member Since</p>
              <p className="text-2xl font-semibold">
                {profileCardInfo.createdAt
                  ? new Date(profileCardInfo.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <h3 className="text-lg font-semibold">Profile Controls</h3>
            <p className="text-sm text-muted-foreground">Update your public identity.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Wallet Status</p>
              <p className="text-xs text-gray-500">
                Connected as {formatWalletAddress(profileCardInfo.walletAddress || "")}
              </p>
            </div>
            <EditProfileDialog onProfileUpdate={refetchUser} isProcessing={isVisible} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Data & Privacy Hub</h3>
            <p className="text-sm text-muted-foreground">
              Choose exactly what you want to export. Snapshots never leave your browser.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Profile Snapshot</p>
                  <p className="text-sm text-gray-500">
                    Includes your identity info and preferences.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                  disabled={isExportingProfile}
                  onClick={exportProfileSnapshot}
                >
                  {isExportingProfile ? "Preparing…" : "Download"}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Transaction Ledger</p>
                  <p className="text-sm text-gray-500">
                    Detailed on-chain history for audits or reimbursements.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                  disabled={isExportingTransactions || txs.length === 0}
                  onClick={exportTransactionLedger}
                >
                  {isExportingTransactions ? "Preparing…" : "Export JSON"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <p className="text-sm text-muted-foreground">
                Payments you&apos;ve sent or received on-chain.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {txs.length > 0 && `${txs.length} recorded movement${txs.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {txsLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading transactions…</div>
          ) : txsError ? (
            <div className="p-6 text-sm text-red-600">Error: {txsError}</div>
          ) : txs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            <div className="max-h-96 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 border-t bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Amount (USD)</th>
                    <th className="px-4 py-3">Study</th>
                    <th className="px-4 py-3">Tx Hash</th>
                    <th className="px-4 py-3">Date</th>
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
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 font-medium">{formatUsd(tx.valueUsd ?? 0)}</td>
                        <td className="px-4 py-3">#{tx.studyId}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              window.open(
                                `https://sepolia.etherscan.io/tx/${tx.transactionHash}`,
                                "_blank",
                                "noopener"
                              )
                            }
                            className="inline-flex items-center gap-1 font-mono text-xs text-indigo-600 hover:text-indigo-700"
                            title={tx.transactionHash}
                          >
                            {tx.transactionHash.slice(0, 10)}…
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString()}</td>
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

"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, ExternalLink, DollarSign } from "lucide-react";

import { ProfileCardProps } from "@/interfaces/profile";
import { useProfile } from "@/contexts/ProfileContext";
import { getUser } from "@/services/api/userService";
import { useAccount } from "wagmi";
import EditProfileDialog from "./editProfileDialog";
import { useUser } from "@/hooks/useUser";
import { getTransactionByWalletAddress } from "@/services/api/transactionService";
import { Transaction } from "@/interfaces/transaction";
import { useTxStatusState } from "@/hooks/useTxStatus";
import WalletAvatar from "@/components/walletAvatar";
import { getWalletTheme } from "@/lib/walletTheme";

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

  const formatDateTime = (value: string | number | Date) => {
    if (!value) return "—";
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      date
    );
  };

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

  const walletTheme = getWalletTheme(address);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="overflow-hidden !py-0">
        <div className={`bg-gradient-to-br ${walletTheme.gradient} p-6 text-white sm:p-8`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <WalletAvatar address={address} size={96} className="flex-shrink-0" />

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
            <p className="text-sm text-muted-foreground">
              Manage your identity and account settings.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Wallet Connected</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {formatWalletAddress(profileCardInfo.walletAddress || "")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Identity Settings</h4>
                <EditProfileDialog onProfileUpdate={refetchUser} isProcessing={isVisible} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">
              Choose exactly what information you want to export.
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
                  className="shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
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
                    Detailed on-chain history for studies compensations.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
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
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Transaction History
              </h3>
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
            <>
              <div className="hidden md:block">
                <div className="max-h-[32rem] overflow-x-auto overflow-y-auto rounded-b-2xl border-t bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead className="sticky top-0 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
                      <tr className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-5 py-3">Direction</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Study</th>
                        <th className="px-5 py-3">Tx Hash</th>
                        <th className="px-5 py-3">Date</th>
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
                          <tr
                            key={tx.id}
                            className="border-t bg-white/80 transition hover:bg-gray-50/90"
                          >
                            <td className="px-5 py-4 text-center align-top">
                              <div className="flex items-center justify-center gap-2">
                                {dirIcon}
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full px-2 py-0 text-xs ${
                                    incoming
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {incoming ? "Incoming" : "Outgoing"}
                                </Badge>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {incoming
                                  ? `From ${formatWalletAddress(tx.fromWallet)}`
                                  : `To ${formatWalletAddress(tx.toWallet)}`}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center align-top">
                              <div
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                  incoming
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {formatUsd(tx.valueUsd ?? 0)}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center align-top">
                              <Badge className="rounded-full bg-purple-50 text-purple-700">
                                Study #{tx.studyId}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-center align-top">
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
                            <td className="px-5 py-4 text-center align-top text-sm text-gray-600">
                              {formatDateTime(tx.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden">
                <div className="max-h-[32rem] space-y-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {txs.map((tx) => {
                    const incoming = tx.toWallet?.toLowerCase() === viewerWallet;
                    return (
                      <div
                        key={tx.id}
                        className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-3 ${
                              incoming
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {incoming ? "Incoming" : "Outgoing"}
                          </Badge>
                          <span
                            className={`text-lg font-semibold ${
                              incoming ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatUsd(tx.valueUsd ?? 0)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {incoming
                            ? `From ${formatWalletAddress(tx.fromWallet)}`
                            : `To ${formatWalletAddress(tx.toWallet)}`}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <p className="font-semibold text-gray-700">Study</p>
                            <p>#{tx.studyId}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Date</p>
                            <p>{formatDateTime(tx.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            window.open(
                              `https://sepolia.etherscan.io/tx/${tx.transactionHash}`,
                              "_blank",
                              "noopener"
                            )
                          }
                          className="mt-3 inline-flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-[13px] font-medium text-indigo-700 transition hover:bg-indigo-100"
                          title={tx.transactionHash}
                        >
                          <span className="truncate font-mono">
                            {tx.transactionHash.slice(0, 12)}…
                          </span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;

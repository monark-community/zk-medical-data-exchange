"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Config } from "@/config/config";
import { ProfileProvider } from "@/contexts/ProfileContext";

const clientId =
  Config.WEB3AUTH_CLIENT_ID ??
  (() => {
    throw new Error("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not set in the environment variables.");
  })();

const queryClient = new QueryClient();

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
  },
};

export default function Provider({
  children,
  web3authInitialState,
}: {
  children: React.ReactNode;
  web3authInitialState: IWeb3AuthState | undefined;
}) {
  return (
    <WagmiProvider>
      <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
        <QueryClientProvider client={queryClient}>
          <ProfileProvider>{children}</ProfileProvider>
        </QueryClientProvider>
      </Web3AuthProvider>
    </WagmiProvider>
  );
}

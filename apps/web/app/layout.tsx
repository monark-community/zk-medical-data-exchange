import Provider from "@/components/provider";
import { Metadata } from "next";
import { cookieToWeb3AuthState } from "@web3auth/modal";
import { headers } from "next/headers";
import "./globals.css";
import TxStatusOverlay from "@/components/TxStatusOverlay";

export const metadata: Metadata = {
  title: "Cura",
  description: "A ZK-Powered Medical Data Exchange",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get("cookie"));
  return (
    <html lang="en">
      <body>
        <Provider web3authInitialState={web3authInitialState}>{children}</Provider>
        <TxStatusOverlay />
      </body>
    </html>
  );
}

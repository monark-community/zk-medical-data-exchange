"use client";

import Dashboard from "@/app/dashboard/page";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

function App() {
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { address } = useAccount();

  const loggedInView = (
    <div>
      <nav className="fixed top-0 w-screen flex justify-end">
        <div className="flex flex-col items-end gap-4 p-4">
          <div>Wallet Address : {address}</div>
          <button
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      </nav>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Dashboard />
      </div>
    </div>
  );

  const unloggedInView = (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <nav className="fixed top-0 w-screen flex justify-end">
        <button
          className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 m-4"
          onClick={() => connect()}
        >
          Connect Wallet
        </button>
      </nav>
    </div>
  );

  return (
    <div>
      {isConnected ? loggedInView : unloggedInView}
    </div>
  );
}

export default App;

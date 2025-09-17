"use client";

import { Button } from "@/components/ui/button";
import { requestNonce } from "@/services/authenticationService";

export default function Home() {
  const handleLoginAttempt = () => {
    try {
      // TODO [BP] - Once MetaMask auth has been added, pass the actual wallet_address as a parameter to requestNonce.
      requestNonce("0x0123456789abcdef0123456789abcdef01234567");
    } catch (error) {
      console.error("Failed to login user:", error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button onClick={handleLoginAttempt}>Login</Button>
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link href="/dashboard">
        <Button>Login</Button>
      </Link>
    </main>
  );
}

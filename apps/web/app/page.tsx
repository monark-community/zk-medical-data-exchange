import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">CURA</h1>
      <Link href={"https://example.com"}>
        <Button variant={"default"}>Example link</Button>
      </Link>
      <p className="mt-4 text-lg">This is a simple Next.js application...</p>
    </main>
  );
}

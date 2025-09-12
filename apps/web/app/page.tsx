import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">CURA</h1>
      <ul>
        {todos?.map((todo: any) => (
          <li key={todo.id}>
            Id : {todo.id} Title : {todo.title}
          </li>
        ))}
      </ul>
      <Link href={"https://example.com"}>
        <Button variant={"default"}>Example link</Button>
      </Link>
      <p className="mt-4 text-lg">This is a simple Next.js application...</p>
    </main>
  );
}

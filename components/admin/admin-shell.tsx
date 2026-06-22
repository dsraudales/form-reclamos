"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold">
              CREE Admin
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/admin">Registros</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Salir
            </Button>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

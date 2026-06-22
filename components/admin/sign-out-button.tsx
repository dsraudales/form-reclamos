"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button className="mt-2 h-8 px-2 text-xs" variant="outline" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
      Salir
    </Button>
  );
}

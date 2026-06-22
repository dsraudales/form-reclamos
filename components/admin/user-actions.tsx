"use client";

import type { AdminRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UserActions({ userId, role, active }: { userId: string; role: AdminRole; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(payload: { role?: AdminRole; active?: boolean }) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...payload })
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        defaultValue={role}
        disabled={loading}
        onChange={(event) => patch({ role: event.target.value as AdminRole })}
      >
        <option value="ADMIN">ADMIN</option>
        <option value="REVISOR">REVISOR</option>
        <option value="AUDITOR">AUDITOR</option>
      </select>
      <Button variant="outline" size="sm" disabled={loading} onClick={() => patch({ active: !active })}>
        {active ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}

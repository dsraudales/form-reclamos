"use client";

import type { AdminRole } from "@prisma/client";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        role: form.get("role") as AdminRole,
        active: form.get("active") === "on"
      })
    });

    setLoading(false);
    if (!response.ok) {
      setMessage("No fue posible crear el usuario.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Usuario creado.");
    router.refresh();
  }

  return (
    <form className="grid gap-4 md:grid-cols-[1fr_1fr_160px_120px]" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="email">Correo institucional</Label>
        <Input id="email" name="email" type="email" required maxLength={254} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" maxLength={180} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select id="role" name="role" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="REVISOR">
          <option value="ADMIN">ADMIN</option>
          <option value="REVISOR">REVISOR</option>
          <option value="AUDITOR">AUDITOR</option>
        </select>
      </div>
      <div className="flex items-end">
        <label className="flex h-10 items-center gap-2 text-sm">
          <input name="active" type="checkbox" defaultChecked />
          Activo
        </label>
      </div>
      <div className="md:col-span-4">
        <Button type="submit" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creando" : "Crear usuario"}
        </Button>
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}

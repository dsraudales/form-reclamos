"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  maxFiles,
  maxFileSizeBytes,
  signedUrlTtlSeconds
}: {
  maxFiles: number;
  maxFileSizeBytes: number;
  signedUrlTtlSeconds: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadLimits: {
          maxFiles: Number(form.get("maxFiles")),
          maxFileSizeBytes: Number(form.get("maxFileSizeBytes")),
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
        },
        signedUrlTtlSeconds: Number(form.get("signedUrlTtlSeconds"))
      })
    });

    setMessage(response.ok ? "Configuración actualizada." : "No fue posible actualizar.");
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="maxFiles">Máximo de fotos</Label>
        <Input id="maxFiles" name="maxFiles" type="number" min={1} max={10} defaultValue={maxFiles} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxFileSizeBytes">Tamaño por archivo</Label>
        <Input id="maxFileSizeBytes" name="maxFileSizeBytes" type="number" min={1024} max={15728640} defaultValue={maxFileSizeBytes} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signedUrlTtlSeconds">URL firmada (segundos)</Label>
        <Input id="signedUrlTtlSeconds" name="signedUrlTtlSeconds" type="number" min={60} max={900} defaultValue={signedUrlTtlSeconds} />
      </div>
      <div className="md:col-span-3">
        <Button type="submit">Guardar configuración</Button>
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}

import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function SettingsPage() {
  await requireSession("ADMIN");
  const uploadLimits = await prisma.appSetting.findUnique({ where: { key: "upload_limits" } });
  const signedUrlTtl = await prisma.appSetting.findUnique({ where: { key: "signed_url_ttl_seconds" } });
  const limits =
    typeof uploadLimits?.value === "object" && uploadLimits.value && !Array.isArray(uploadLimits.value)
      ? (uploadLimits.value as { maxFiles?: number; maxFileSizeBytes?: number })
      : {};
  const ttl = typeof signedUrlTtl?.value === "number" ? signedUrlTtl.value : 300;

  return (
    <AdminShell>
      <section className="mx-auto max-w-4xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de carga</CardTitle>
          <CardDescription>La API administrativa permite actualizar estos valores con auditoría.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsForm
            maxFiles={limits.maxFiles ?? 5}
            maxFileSizeBytes={limits.maxFileSizeBytes ?? 5242880}
            signedUrlTtlSeconds={ttl}
          />
          <pre className="overflow-auto rounded-md bg-muted p-4 text-sm">{JSON.stringify(uploadLimits?.value, null, 2)}</pre>
          <div>
            <p className="text-sm text-muted-foreground">Duración URL firmada</p>
            <p className="font-medium">{JSON.stringify(signedUrlTtl?.value)} segundos</p>
          </div>
        </CardContent>
      </Card>
      </section>
    </AdminShell>
  );
}

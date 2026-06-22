import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AuditPage() {
  await requireSession("AUDITOR");
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <AdminShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Logs de auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Objetivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.createdAt.toLocaleString("es-HN")}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.actor?.email ?? "Sistema"}</TableCell>
                  <TableCell>{log.targetId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </section>
    </AdminShell>
  );
}

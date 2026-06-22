import Link from "next/link";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { audit } from "@/lib/audit/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await requireSession("AUDITOR");
  const q = searchParams.q?.trim();
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { clientCode: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  if (q) {
    await audit("CLIENT_QUERY", { actorId: session.user.adminId, metadata: { q } });
  }

  return (
    <AdminShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Registros recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-5 flex gap-2">
            <Input name="q" defaultValue={q} placeholder="Buscar por nombre o código de cliente" />
            <Button type="submit">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Fotos</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.fullName}</TableCell>
                    <TableCell>{client.clientCode}</TableCell>
                    <TableCell>{client._count.photos}</TableCell>
                    <TableCell>{client.createdAt.toLocaleString("es-HN")}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/clients/${client.id}`}>Detalle</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </section>
    </AdminShell>
  );
}

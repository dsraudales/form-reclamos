import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PhotoLink } from "@/components/admin/photo-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { audit } from "@/lib/audit/audit";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession("AUDITOR");
  const { id } = params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "asc" } } }
  });

  if (!client) {
    notFound();
  }

  await audit("CLIENT_QUERY", { actorId: session.user.adminId, targetId: client.id });

  return (
    <AdminShell>
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalle del cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Nombre completo</p>
            <p className="font-medium">{client.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Número/Código</p>
            <p className="font-medium">{client.clientCode}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha</p>
            <p className="font-medium">{client.createdAt.toLocaleString("es-HN")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fotografías asociadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>MIME</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>SHA-256</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.photos.map((photo) => (
                <TableRow key={photo.id}>
                  <TableCell>{photo.originalName ?? photo.objectKey}</TableCell>
                  <TableCell>
                    <Badge>{photo.mimeType}</Badge>
                  </TableCell>
                  <TableCell>{Math.round(photo.sizeBytes / 1024)} KB</TableCell>
                  <TableCell className="max-w-64 truncate font-mono text-xs">{photo.sha256Hash}</TableCell>
                  <TableCell>
                    <PhotoLink photoId={photo.id} />
                  </TableCell>
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

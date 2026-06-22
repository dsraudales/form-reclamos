import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PhotoLink } from "@/components/admin/photo-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { id } = params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "asc" } } }
  });

  if (!client) {
    notFound();
  }

  return (
    <AdminShell email={user.email ?? ""}>
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle del registro</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre completo</p>
              <p className="font-medium">{client.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Numero/Codigo de cliente</p>
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
            <CardTitle>Fotografia</CardTitle>
          </CardHeader>
          <CardContent>
            {client.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay fotografias asociadas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamano</TableHead>
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
                      <TableCell>
                        <PhotoLink photoId={photo.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </AdminShell>
  );
}

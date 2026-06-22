import { AdminShell } from "@/components/admin/admin-shell";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { UserActions } from "@/components/admin/user-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function UsersPage() {
  await requireSession("ADMIN");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Crear usuario administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios administrativos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último ingreso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name ?? "-"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge>{user.active ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell>{user.lastLoginAt?.toLocaleString("es-HN") ?? "-"}</TableCell>
                  <TableCell>
                    <UserActions userId={user.id} role={user.role} active={user.active} />
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

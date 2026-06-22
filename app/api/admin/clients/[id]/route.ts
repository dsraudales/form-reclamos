import { NextResponse } from "next/server";
import { audit } from "@/lib/audit/audit";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireApiSession("AUDITOR");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { createdAt: "asc" } } }
  });

  if (!client) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  await audit("CLIENT_QUERY", { actorId: session.user.adminId, targetId: client.id });
  return NextResponse.json({ client });
}

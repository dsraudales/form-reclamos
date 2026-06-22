import { NextResponse } from "next/server";
import { audit } from "@/lib/audit/audit";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const session = await requireApiSession("AUDITOR");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
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

  return NextResponse.json({ clients });
}

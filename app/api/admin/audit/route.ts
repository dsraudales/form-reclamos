import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const session = await requireApiSession("AUDITOR");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const take = Math.min(Number(searchParams.get("take") ?? "100"), 250);
  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take
  });

  return NextResponse.json({ logs });
}

import { AdminRole, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit/audit";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const patchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  role: z.nativeEnum(AdminRole).optional()
});

const createSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  name: z.string().trim().max(180).optional().nullable(),
  role: z.nativeEnum(AdminRole).default("REVISOR"),
  active: z.boolean().default(true)
});

export async function GET() {
  const session = await requireApiSession("ADMIN");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const session = await requireApiSession("ADMIN");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const before = await prisma.adminUser.findUnique({ where: { id: parsed.data.id } });
  if (!before) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  const user = await prisma.adminUser.update({
    where: { id: parsed.data.id },
    data: {
      active: parsed.data.active,
      role: parsed.data.role
    }
  });

  if (parsed.data.role && parsed.data.role !== before.role) {
    await audit("ROLE_CHANGE", { actorId: session.user.adminId, targetId: user.id, metadata: { from: before.role, to: user.role } });
  }
  if (typeof parsed.data.active === "boolean" && parsed.data.active !== before.active) {
    await audit("USER_STATUS_CHANGE", { actorId: session.user.adminId, targetId: user.id, metadata: { active: user.active } });
  }

  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const session = await requireApiSession("ADMIN");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  try {
    const user = await prisma.adminUser.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name || null,
        role: parsed.data.role,
        active: parsed.data.active
      }
    });

    await audit("USER_CREATED", {
      actorId: session.user.adminId,
      targetId: user.id,
      metadata: { role: user.role, active: user.active }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "No fue posible procesar la solicitud." }, { status: 409 });
    }
    return NextResponse.json({ message: "No fue posible procesar la solicitud." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit/audit";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const settingsSchema = z.object({
  uploadLimits: z
    .object({
      maxFiles: z.number().int().min(1).max(10),
      maxFileSizeBytes: z.number().int().min(1024).max(15 * 1024 * 1024),
      allowedMimeTypes: z.array(z.enum(["image/jpeg", "image/png", "image/webp"])).min(1)
    })
    .optional(),
  signedUrlTtlSeconds: z.number().int().min(60).max(900).optional()
});

export async function GET() {
  const session = await requireApiSession("ADMIN");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const settings = await prisma.appSetting.findMany();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await requireApiSession("ADMIN");
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (parsed.data.uploadLimits) {
    await prisma.appSetting.upsert({
      where: { key: "upload_limits" },
      update: { value: parsed.data.uploadLimits },
      create: { key: "upload_limits", value: parsed.data.uploadLimits }
    });
  }
  if (parsed.data.signedUrlTtlSeconds) {
    await prisma.appSetting.upsert({
      where: { key: "signed_url_ttl_seconds" },
      update: { value: parsed.data.signedUrlTtlSeconds },
      create: { key: "signed_url_ttl_seconds", value: parsed.data.signedUrlTtlSeconds }
    });
  }

  await audit("SETTINGS_CHANGE", { actorId: session.user.adminId, metadata: parsed.data });
  return NextResponse.json({ ok: true });
}

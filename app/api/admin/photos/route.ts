import { NextResponse } from "next/server";
import { audit } from "@/lib/audit/audit";
import { requireApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getSignedPhotoUrl } from "@/lib/storage/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession("AUDITOR");
    if (!session) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Solicitud invalida." }, { status: 400 });
    }

    const photo = await prisma.clientPhoto.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ message: "No encontrado." }, { status: 404 });
    }

    const ttlSetting = await prisma.appSetting.findUnique({ where: { key: "signed_url_ttl_seconds" } });
    const ttlSeconds = typeof ttlSetting?.value === "number" ? Math.min(Math.max(ttlSetting.value, 60), 900) : 300;
    const url = await getSignedPhotoUrl(photo.objectKey, ttlSeconds);
    await audit("PHOTO_VIEW", { actorId: session.user.adminId, targetId: photo.id });
    return NextResponse.json({ url, expiresIn: ttlSeconds });
  } catch (error) {
    console.error("Signed photo URL generation failed.", error);
    return NextResponse.json({ message: "No fue posible cargar la fotografia." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
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

    const url = await getSignedPhotoUrl(photo.objectKey, 300);
    return NextResponse.json({ url, expiresIn: 300 });
  } catch (error) {
    console.error("Signed photo URL generation failed.", error);
    return NextResponse.json({ message: "No fue posible cargar la fotografia." }, { status: 500 });
  }
}

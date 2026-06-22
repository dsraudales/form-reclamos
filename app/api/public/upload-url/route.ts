import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import { env } from "@/lib/env";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ext = String(body.ext ?? "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ message: "Extensión no permitida." }, { status: 400 });
    }

    const objectKey = `uploads/${crypto.randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
    const { token, path } = await createSignedUploadUrl(objectKey);

    return NextResponse.json({ token, path, bucket: env.supabase.bucket });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json({ message: "Error al generar URL de carga." }, { status: 500 });
  }
}

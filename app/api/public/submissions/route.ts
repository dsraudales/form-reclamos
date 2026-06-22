import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

const submissionSchema = z.object({
  fullName: z.string().trim().min(3).max(180),
  clientCode: z.string().trim().min(3).max(80),
  photoPath: z.string().min(1),
  originalName: z.string().max(255),
  mimeType: z.string().max(80),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
    }

    const { fullName, clientCode, photoPath, originalName, mimeType, sizeBytes } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: { fullName, clientCode }
      });

      await tx.clientPhoto.create({
        data: {
          clientId: client.id,
          bucket: env.supabase.bucket,
          objectKey: photoPath,
          originalName: originalName.slice(0, 255),
          mimeType,
          sizeBytes,
          sha256Hash: "client-upload"
        }
      });
    });

    return NextResponse.json({ ok: true, message: "Solicitud recibida." });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ message: "No fue posible procesar la solicitud." }, { status: 500 });
  }
}

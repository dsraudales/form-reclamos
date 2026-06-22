import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/audit";
import { scanBufferWithClamAv } from "@/lib/security/clamav";
import { getIpHash } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rate-limit";
import { getUploadLimits, publicSubmissionSchema, validateImageFile } from "@/lib/security/upload";
import { ensurePhotoBucket, uploadPhotoObject } from "@/lib/minio/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ipHash = await getIpHash();
    const limit = await rateLimit(`submission:${ipHash}`, env.publicRateLimit, 60 * 60);
    if (!limit.allowed) {
      return genericError(429);
    }

    const formData = await request.formData();
    const parsed = publicSubmissionSchema.safeParse({
      fullName: formData.get("fullName"),
      clientCode: formData.get("clientCode"),
      website: formData.get("website") ?? ""
    });

    if (!parsed.success) {
      return genericError(400);
    }

    const files = formData.getAll("photos").filter((item): item is File => item instanceof File);
    const limits = await getUploadLimits();
    if (files.length < 1 || files.length > limits.maxFiles) {
      return genericError(400);
    }

    await ensurePhotoBucket();
    const validated: Array<{
      file: File;
      buffer: Buffer;
      mimeType: string;
      extension: string;
      sha256Hash: string;
    }> = [];

    for (const file of files) {
      const image = await validateImageFile(file, limits);
      await scanBufferWithClamAv(image.buffer);
      validated.push({ file, ...image });
    }

    const h = await headers();
    const userAgent = h.get("user-agent")?.slice(0, 512);

    const client = await prisma.$transaction(async (tx) => {
      const createdClient = await tx.client.create({
        data: {
          fullName: parsed.data.fullName,
          clientCode: parsed.data.clientCode,
          ipHash,
          userAgent
        }
      });

      for (const image of validated) {
        const objectKey = `clients/${createdClient.id}/${crypto.randomUUID()}.${image.extension}`;
        await uploadPhotoObject(objectKey, image.buffer, image.mimeType);
        await tx.clientPhoto.create({
          data: {
            clientId: createdClient.id,
            bucket: env.minio.bucket,
            objectKey,
            originalName: image.file.name.slice(0, 255),
            mimeType: image.mimeType,
            sizeBytes: image.buffer.length,
            sha256Hash: image.sha256Hash
          }
        });
      }

      return createdClient;
    });

    await audit("SUBMISSION_CREATED", { targetId: client.id });
    return NextResponse.json({ ok: true, message: "Solicitud recibida." });
  } catch {
    return genericError(400);
  }
}

function genericError(status: number) {
  return NextResponse.json({ ok: false, message: "No fue posible procesar la solicitud." }, { status });
}

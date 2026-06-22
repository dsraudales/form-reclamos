import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const publicSubmissionSchema = z.object({
  fullName: z.string().trim().min(3).max(180),
  clientCode: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9._\-\/ ]+$/),
  website: z.string().max(0).optional()
});

export const defaultUploadLimits = {
  maxFiles: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
};

export type UploadLimits = typeof defaultUploadLimits;

export async function getUploadLimits(): Promise<UploadLimits> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "upload_limits" } });
  if (!setting || typeof setting.value !== "object" || Array.isArray(setting.value)) {
    return defaultUploadLimits;
  }

  const parsed = z
    .object({
      maxFiles: z.number().int().min(1).max(10),
      maxFileSizeBytes: z.number().int().min(1024).max(15 * 1024 * 1024),
      allowedMimeTypes: z.array(z.enum(["image/jpeg", "image/png", "image/webp"])).min(1)
    })
    .safeParse(setting.value);

  return parsed.success ? parsed.data : defaultUploadLimits;
}

export async function validateImageFile(file: File, limits: UploadLimits) {
  if (file.size <= 0 || file.size > limits.maxFileSizeBytes) {
    throw new Error("invalid_file");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mimeType = detected?.mime;

  if (!mimeType || !limits.allowedMimeTypes.includes(mimeType)) {
    throw new Error("invalid_file");
  }

  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return {
    buffer,
    mimeType,
    extension,
    sha256Hash: crypto.createHash("sha256").update(buffer).digest("hex")
  };
}

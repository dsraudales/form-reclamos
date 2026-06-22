import { Client } from "minio";
import { env } from "@/lib/env";

const globalForMinio = globalThis as unknown as { minioClient?: Client };

export const minioClient =
  globalForMinio.minioClient ??
  new Client({
    endPoint: env.minio.endPoint,
    port: env.minio.port,
    useSSL: env.minio.useSSL,
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

export async function ensurePhotoBucket() {
  const exists = await minioClient.bucketExists(env.minio.bucket);
  if (!exists) {
    await minioClient.makeBucket(env.minio.bucket);
  }
}

export async function uploadPhotoObject(objectKey: string, buffer: Buffer, mimeType: string) {
  await minioClient.putObject(env.minio.bucket, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
    "X-Content-Type-Options": "nosniff"
  });
}

export async function getSignedPhotoUrl(objectKey: string, ttlSeconds: number) {
  return minioClient.presignedGetObject(env.minio.bucket, objectKey, ttlSeconds);
}

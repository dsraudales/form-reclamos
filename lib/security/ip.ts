import crypto from "crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export function hashIp(ip: string) {
  return crypto.createHmac("sha256", env.ipHashSecret).update(ip).digest("hex");
}

export async function getIpHash() {
  return hashIp(await getClientIp());
}

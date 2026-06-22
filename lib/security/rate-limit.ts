import Redis from "ioredis";
import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis = globalForRedis.redis ?? new Redis(env.redisUrl, { lazyConnect: true });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  if (redis.status === "wait") {
    await redis.connect();
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetSeconds: ttl > 0 ? ttl : windowSeconds
  };
}

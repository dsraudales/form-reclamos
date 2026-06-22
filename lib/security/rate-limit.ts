import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as { upstash?: Redis };

function getRedis(): Redis {
  if (!globalForRedis.upstash) {
    globalForRedis.upstash = new Redis({ url: env.upstash.url, token: env.upstash.token });
  }
  return globalForRedis.upstash;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = getRedis();
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

import { getUpstashConfig, hasUpstashConfig } from "@/lib/env";

type RedisClient = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
};

type MemoryEntry = {
  count: number;
  expiresAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  upstash?: RedisClient | null;
  rateLimitWarningsShown?: boolean;
  localRateLimitStore?: Map<string, MemoryEntry>;
};

const dynamicImport = new Function("moduleName", "return import(moduleName);") as (
  moduleName: string
) => Promise<{ Redis: new (config: { url: string; token: string }) => RedisClient }>;

async function getRedis(): Promise<RedisClient | null> {
  if (!hasUpstashConfig()) {
    return null;
  }

  if ("upstash" in globalForRateLimit) {
    return globalForRateLimit.upstash ?? null;
  }

  try {
    const { url, token } = getUpstashConfig();
    const { Redis } = await dynamicImport("@upstash/redis");

    globalForRateLimit.upstash = new Redis({ url, token });
  } catch (error) {
    globalForRateLimit.upstash = null;
    if (!globalForRateLimit.rateLimitWarningsShown) {
      console.warn(
        "Upstash rate limiting is unavailable, using in-memory fallback.",
        error instanceof Error ? error.message : error
      );
      globalForRateLimit.rateLimitWarningsShown = true;
    }
  }

  return globalForRateLimit.upstash;
}

function getMemoryStore() {
  if (!globalForRateLimit.localRateLimitStore) {
    globalForRateLimit.localRateLimitStore = new Map();
  }

  return globalForRateLimit.localRateLimitStore;
}

function rateLimitInMemory(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const expiresAt = now + windowSeconds * 1000;
  const store = getMemoryStore();
  const current = store.get(key);

  if (!current || current.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetSeconds: windowSeconds
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    resetSeconds: Math.max(Math.ceil((current.expiresAt - now) / 1000), 1)
  };
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = await getRedis();
  if (!redis) {
    return rateLimitInMemory(key, limit, windowSeconds);
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

const store = new Map<string, { count: number; expiresAt: number }>();

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };
  }

  entry.count += 1;
  const ttl = Math.ceil((entry.expiresAt - now) / 1000);
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(limit - entry.count, 0),
    resetSeconds: ttl
  };
}

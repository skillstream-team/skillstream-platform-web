type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getSessionCachedValue<T>(key: string, compute: () => T, ttlMs = 20_000): T {
  const now = Date.now();
  const existing = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = compute();
  memoryCache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
  return value;
}

export function clearSessionCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }

  Array.from(memoryCache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });
}

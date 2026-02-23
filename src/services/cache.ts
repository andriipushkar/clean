import { redis, CACHE_TTL } from '@/lib/redis';

export { CACHE_TTL };

/**
 * Get cached value by key. Returns null on cache miss.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Set cache value with TTL in seconds.
 */
export async function cacheSet(key: string, data: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    // Silently fail — cache is non-critical
  }
}

/**
 * Invalidate cache keys matching a glob pattern.
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export async function cacheInvalidate(pattern: string): Promise<number> {
  let deleted = 0;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');
  } catch {
    // Silently fail
  }
  return deleted;
}

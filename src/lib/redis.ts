import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6380/0', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export const CACHE_TTL = {
  SHORT: 60, // 1 хв
  MEDIUM: 300, // 5 хв
  LONG: 3600, // 1 год
  DAY: 86400, // 24 год
} as const;

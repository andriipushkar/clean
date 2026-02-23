import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedisInstance = {
  ping: vi.fn().mockResolvedValue('PONG'),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  status: 'ready',
};

vi.mock('ioredis', () => {
  return {
    default: class Redis {
      constructor() {
        return mockRedisInstance;
      }
    },
  };
});

describe('redis', () => {
  beforeEach(() => {
    vi.resetModules();
    const g = globalThis as unknown as { redis: unknown };
    delete g.redis;
  });

  it('should export redis instance', async () => {
    const { redis } = await import('./redis');
    expect(redis).toBeDefined();
  });

  it('should export CACHE_TTL constants', async () => {
    const { CACHE_TTL } = await import('./redis');
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.MEDIUM).toBe(300);
    expect(CACHE_TTL.LONG).toBe(3600);
    expect(CACHE_TTL.DAY).toBe(86400);
  });

  it('should have correct CACHE_TTL ordering', async () => {
    const { CACHE_TTL } = await import('./redis');
    expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
    expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
    expect(CACHE_TTL.LONG).toBeLessThan(CACHE_TTL.DAY);
  });

  it('should create redis instance from ioredis', async () => {
    const { redis } = await import('./redis');
    expect(redis).toBe(mockRedisInstance);
  });

  it('should cache redis on globalThis in non-production', async () => {
    const { redis } = await import('./redis');
    const g = globalThis as unknown as { redis: unknown };
    expect(g.redis).toBe(redis);
  });

  it('should reuse cached instance on subsequent imports', async () => {
    const { redis: first } = await import('./redis');
    vi.resetModules();
    const { redis: second } = await import('./redis');
    expect(second).toBe(first);
  });

  it('CACHE_TTL DAY should equal 24 hours in seconds', async () => {
    const { CACHE_TTL } = await import('./redis');
    expect(CACHE_TTL.DAY).toBe(24 * 60 * 60);
  });
});

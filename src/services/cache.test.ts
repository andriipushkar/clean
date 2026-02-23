import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  scan: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  redis: mockRedis,
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
    DAY: 86400,
  },
}));

import { cacheGet, cacheSet, cacheInvalidate, CACHE_TTL } from './cache';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cacheGet', () => {
  it('should return parsed data on cache hit', async () => {
    const data = { products: [{ id: 1 }], total: 1 };
    mockRedis.get.mockResolvedValue(JSON.stringify(data));

    const result = await cacheGet<typeof data>('test:key');

    expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    expect(result).toEqual(data);
  });

  it('should return null on cache miss', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await cacheGet('test:miss');

    expect(result).toBeNull();
  });

  it('should return null on Redis error', async () => {
    mockRedis.get.mockRejectedValue(new Error('Connection refused'));

    const result = await cacheGet('test:error');

    expect(result).toBeNull();
  });

  it('should return null for invalid JSON', async () => {
    mockRedis.get.mockResolvedValue('not-valid-json{');

    const result = await cacheGet('test:bad');

    expect(result).toBeNull();
  });
});

describe('cacheSet', () => {
  it('should set value with TTL', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cacheSet('test:key', { foo: 'bar' }, CACHE_TTL.MEDIUM);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'test:key',
      JSON.stringify({ foo: 'bar' }),
      'EX',
      300
    );
  });

  it('should silently fail on Redis error', async () => {
    mockRedis.set.mockRejectedValue(new Error('Connection refused'));

    await expect(cacheSet('test:key', { data: true }, 60)).resolves.toBeUndefined();
  });
});

describe('cacheInvalidate', () => {
  it('should delete matching keys using SCAN', async () => {
    mockRedis.scan.mockResolvedValueOnce(['0', ['products:list:1', 'products:list:2']]);
    mockRedis.del.mockResolvedValue(2);

    const deleted = await cacheInvalidate('products:*');

    expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'products:*', 'COUNT', 100);
    expect(mockRedis.del).toHaveBeenCalledWith('products:list:1', 'products:list:2');
    expect(deleted).toBe(2);
  });

  it('should handle multiple SCAN iterations', async () => {
    mockRedis.scan
      .mockResolvedValueOnce(['42', ['key1', 'key2']])
      .mockResolvedValueOnce(['0', ['key3']]);
    mockRedis.del.mockResolvedValue(2).mockResolvedValue(1);

    const deleted = await cacheInvalidate('prefix:*');

    expect(mockRedis.scan).toHaveBeenCalledTimes(2);
    expect(mockRedis.del).toHaveBeenCalledTimes(2);
    expect(deleted).toBe(3);
  });

  it('should return 0 when no keys match', async () => {
    mockRedis.scan.mockResolvedValueOnce(['0', []]);

    const deleted = await cacheInvalidate('nonexistent:*');

    expect(deleted).toBe(0);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('should silently fail on Redis error', async () => {
    mockRedis.scan.mockRejectedValue(new Error('Connection refused'));

    const deleted = await cacheInvalidate('test:*');

    expect(deleted).toBe(0);
  });
});

describe('CACHE_TTL', () => {
  it('should export correct TTL values', () => {
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.MEDIUM).toBe(300);
    expect(CACHE_TTL.LONG).toBe(3600);
    expect(CACHE_TTL.DAY).toBe(86400);
  });
});

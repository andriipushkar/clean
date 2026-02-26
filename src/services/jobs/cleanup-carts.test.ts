import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { cleanupStaleCarts } from './cleanup-carts';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cleanupStaleCarts', () => {
  it('should delete stale cart items older than 30 days', async () => {
    mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 8 } as never);

    const result = await cleanupStaleCarts();

    expect(result).toBe(8);
    expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        addedAt: { lt: expect.any(Date) },
      },
    });

    // Verify cutoff date is approximately 30 days ago
    const call = mockPrisma.cartItem.deleteMany.mock.calls[0][0] as { where: { addedAt: { lt: Date } } };
    const cutoff = call.where.addedAt.lt;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - cutoff.getTime();
    expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
    expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 1000);
  });

  it('should return 0 when no stale carts exist', async () => {
    mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 0 } as never);

    const result = await cleanupStaleCarts();

    expect(result).toBe(0);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    refreshToken: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { cleanupExpiredTokens } from './cleanup-tokens';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cleanupExpiredTokens', () => {
  it('should delete expired tokens and return count', async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 15 } as never);

    const result = await cleanupExpiredTokens();

    expect(result).toBe(15);
    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: expect.any(Date) },
      },
    });
  });

  it('should return 0 when no tokens are expired', async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 } as never);

    const result = await cleanupExpiredTokens();

    expect(result).toBe(0);
  });
});

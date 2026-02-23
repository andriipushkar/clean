import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    loyaltyAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTransaction: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
    loyaltyLevel: {
      findMany: vi.fn().mockResolvedValue([
        { name: 'bronze', minSpent: 0, pointsMultiplier: 1, discountPercent: 0, sortOrder: 0 },
      ]),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe('loyalty service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create loyalty account if not exists', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.loyaltyAccount.create).mockResolvedValue({
      id: 1, userId: 1, points: 0, totalSpent: 0, level: 'bronze',
    } as never);

    const { getOrCreateLoyaltyAccount } = await import('./loyalty');
    const account = await getOrCreateLoyaltyAccount(1);
    expect(account.points).toBe(0);
    expect(prisma.loyaltyAccount.create).toHaveBeenCalled();
  });

  it('should throw when spending more points than available', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue({
      id: 1, userId: 1, points: 50, totalSpent: 1000, level: 'bronze',
    } as never);

    const { spendPoints, LoyaltyError } = await import('./loyalty');
    await expect(spendPoints(1, 100, 1)).rejects.toThrow(LoyaltyError);
  });
});

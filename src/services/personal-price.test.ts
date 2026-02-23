import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    personalPrice: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe('personal-price service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty list', async () => {
    const { getPersonalPrices } = await import('./personal-price');
    const result = await getPersonalPrices({ page: 1, limit: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should throw on delete non-existent', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.personalPrice.findUnique).mockResolvedValue(null);

    const { deletePersonalPrice, PersonalPriceError } = await import('./personal-price');
    await expect(deletePersonalPrice(999)).rejects.toThrow(PersonalPriceError);
  });
});

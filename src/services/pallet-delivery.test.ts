import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    siteSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('pallet-delivery service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default config when no setting exists', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);

    const { getPalletConfig } = await import('./pallet-delivery');
    const config = await getPalletConfig();

    expect(config.enabled).toBe(true);
    expect(config.basePrice).toBe(1500);
    expect(config.pricePerKg).toBe(3);
    expect(config.regions).toHaveLength(5);
  });

  it('should calculate delivery cost with region multiplier', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);

    const { calculatePalletDeliveryCost } = await import('./pallet-delivery');
    const result = await calculatePalletDeliveryCost(200, 'Захід');

    // basePrice(1500) + 200 * pricePerKg(3) = 2100, * multiplier(1.3) = 2730
    expect(result.cost).toBe(2730);
    expect(result.estimatedDays).toBe('3-5');
  });

  it('should throw for weight below minimum', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);

    const { calculatePalletDeliveryCost, PalletDeliveryError } = await import('./pallet-delivery');
    await expect(calculatePalletDeliveryCost(10)).rejects.toThrow(PalletDeliveryError);
  });

  it('should validate pallet order', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);

    const { validatePalletOrder } = await import('./pallet-delivery');

    const valid = await validatePalletOrder(200);
    expect(valid.valid).toBe(true);

    const invalid = await validatePalletOrder(10);
    expect(invalid.valid).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    referral: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/config/env', () => ({
  env: { APP_URL: 'http://localhost:3000' },
}));

describe('referral service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate referral code', async () => {
    const { generateReferralCode } = await import('./referral');
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(/^[A-F0-9]+$/.test(code)).toBe(true);
  });

  it('should throw on grant bonus for non-existent referral', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.referral.findUnique).mockResolvedValue(null);

    const { grantReferralBonus, ReferralError } = await import('./referral');
    await expect(
      grantReferralBonus(999, { bonusType: 'cashback', bonusValue: 50 })
    ).rejects.toThrow(ReferralError);
  });
});

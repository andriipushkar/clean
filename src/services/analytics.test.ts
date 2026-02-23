import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyFunnelStats: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
  },
}));

describe('analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversionFunnel', () => {
    it('should aggregate funnel stats and calculate conversion rates', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.dailyFunnelStats.findMany).mockResolvedValue([
        {
          id: 1, date: new Date(), pageViews: 1000, productViews: 500,
          addToCartCount: 200, cartViews: 150, checkoutStarts: 100,
          ordersCompleted: 50, totalRevenue: 25000, uniqueVisitors: 800,
        },
        {
          id: 2, date: new Date(), pageViews: 800, productViews: 400,
          addToCartCount: 160, cartViews: 120, checkoutStarts: 80,
          ordersCompleted: 40, totalRevenue: 20000, uniqueVisitors: 600,
        },
      ] as never);

      const { getConversionFunnel } = await import('./analytics');
      const result = await getConversionFunnel(30);

      expect(result.totals.pageViews).toBe(1800);
      expect(result.totals.ordersCompleted).toBe(90);
      expect(result.steps).toHaveLength(6);
      expect(result.steps[0].conversionFromFirst).toBe(100);
      expect(result.steps[5].value).toBe(90);
    });

    it('should handle empty funnel stats', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.dailyFunnelStats.findMany).mockResolvedValue([]);

      const { getConversionFunnel } = await import('./analytics');
      const result = await getConversionFunnel(30);

      expect(result.totals.pageViews).toBe(0);
      expect(result.steps[0].conversionFromFirst).toBe(0);
    });
  });

  describe('getCohortAnalysis', () => {
    it('should group users by registration month and calculate retention', async () => {
      const { prisma } = await import('@/lib/prisma');
      const jan = new Date('2026-01-15');
      const feb = new Date('2026-02-10');

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 1, createdAt: jan },
        { id: 2, createdAt: jan },
        { id: 3, createdAt: feb },
      ] as never);

      vi.mocked(prisma.order.findMany).mockResolvedValue([
        { userId: 1, createdAt: jan },
        { userId: 1, createdAt: feb },
        { userId: 3, createdAt: feb },
      ] as never);

      const { getCohortAnalysis } = await import('./analytics');
      const result = await getCohortAnalysis(6);

      expect(result).toHaveLength(2);
      const janCohort = result.find((r) => r.cohort === '2026-01');
      expect(janCohort?.totalUsers).toBe(2);
      expect(janCohort?.retention['2026-01']).toBe(50); // 1 out of 2
    });
  });

  describe('getABCAnalysis', () => {
    it('should classify products into A, B, C categories', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([
        { productId: 1, productCode: 'P1', productName: 'Product 1', _sum: { subtotal: 8000, quantity: 100 }, _count: 50 },
        { productId: 2, productCode: 'P2', productName: 'Product 2', _sum: { subtotal: 1500, quantity: 30 }, _count: 15 },
        { productId: 3, productCode: 'P3', productName: 'Product 3', _sum: { subtotal: 500, quantity: 10 }, _count: 5 },
      ] as never);

      const { getABCAnalysis } = await import('./analytics');
      const result = await getABCAnalysis(30);

      expect(result.summary.totalRevenue).toBe(10000);
      expect(result.summary.totalProducts).toBe(3);
      expect(result.products[0].category).toBe('A');
      expect(result.products[2].category).toBe('C');
    });
  });
});

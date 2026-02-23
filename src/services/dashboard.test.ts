import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardStats } from './dashboard';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getDashboardStats', () => {
  it('should return aggregated dashboard statistics', async () => {
    mockPrisma.order.aggregate
      .mockResolvedValueOnce({ _count: 5, _sum: { totalAmount: 12500 } } as never)  // today
      .mockResolvedValueOnce({ _count: 3, _sum: { totalAmount: 8000 } } as never);  // yesterday
    mockPrisma.order.count.mockResolvedValue(2); // new orders
    mockPrisma.user.count
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(15)  // wholesalers
      .mockResolvedValueOnce(7)   // new this week
      .mockResolvedValueOnce(3);  // pending wholesale
    mockPrisma.product.count
      .mockResolvedValueOnce(200) // total
      .mockResolvedValueOnce(10); // out of stock
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { productName: 'Product A', _sum: { quantity: 50 } },
      { productName: 'Product B', _sum: { quantity: 30 } },
    ] as never);

    const result = await getDashboardStats();

    expect(result.orders).toEqual({
      todayCount: 5,
      todayRevenue: 12500,
      yesterdayCount: 3,
      yesterdayRevenue: 8000,
      newCount: 2,
    });

    expect(result.users).toEqual({
      total: 100,
      wholesalers: 15,
      newThisWeek: 7,
      pendingWholesale: 3,
    });

    expect(result.products).toEqual({
      total: 200,
      outOfStock: 10,
    });

    expect(result.topProducts).toEqual([
      { name: 'Product A', quantity: 50 },
      { name: 'Product B', quantity: 30 },
    ]);
  });

  it('should handle zero revenue', async () => {
    mockPrisma.order.aggregate
      .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: null } } as never)
      .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: null } } as never);
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.orderItem.groupBy.mockResolvedValue([] as never);

    const result = await getDashboardStats();

    expect(result.orders.todayRevenue).toBe(0);
    expect(result.orders.yesterdayRevenue).toBe(0);
    expect(result.topProducts).toEqual([]);
  });

  it('should handle null quantity in top products', async () => {
    mockPrisma.order.aggregate.mockResolvedValue({ _count: 0, _sum: { totalAmount: null } } as never);
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { productName: 'Product X', _sum: { quantity: null } },
    ] as never);

    const result = await getDashboardStats();
    expect(result.topProducts[0].quantity).toBe(0);
  });
});

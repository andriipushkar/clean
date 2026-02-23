import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    todayOrders,
    yesterdayOrders,
    newOrders,
    totalUsers,
    wholesalers,
    newUsersWeek,
    pendingWholesale,
    totalProducts,
    outOfStockProducts,
    topProducts,
  ] = await Promise.all([
    // Today's orders
    prisma.order.aggregate({
      where: { createdAt: { gte: today } },
      _count: true,
      _sum: { totalAmount: true },
    }),
    // Yesterday's orders
    prisma.order.aggregate({
      where: { createdAt: { gte: yesterday, lt: today } },
      _count: true,
      _sum: { totalAmount: true },
    }),
    // New (unprocessed) orders
    prisma.order.count({ where: { status: 'new_order' } }),
    // Total users
    prisma.user.count(),
    // Wholesalers
    prisma.user.count({ where: { role: 'wholesaler' } }),
    // New users this week
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    // Pending wholesale requests
    prisma.user.count({ where: { wholesaleStatus: 'pending' } }),
    // Total products
    prisma.product.count({ where: { isActive: true } }),
    // Out of stock
    prisma.product.count({ where: { isActive: true, quantity: 0 } }),
    // Top products by orders
    prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    orders: {
      todayCount: todayOrders._count,
      todayRevenue: Number(todayOrders._sum.totalAmount || 0),
      yesterdayCount: yesterdayOrders._count,
      yesterdayRevenue: Number(yesterdayOrders._sum.totalAmount || 0),
      newCount: newOrders,
    },
    users: {
      total: totalUsers,
      wholesalers,
      newThisWeek: newUsersWeek,
      pendingWholesale,
    },
    products: {
      total: totalProducts,
      outOfStock: outOfStockProducts,
    },
    topProducts: topProducts.map((p) => ({
      name: p.productName,
      quantity: p._sum.quantity || 0,
    })),
  };
}

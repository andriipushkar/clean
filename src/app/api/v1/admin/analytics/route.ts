import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') || 'sales';
      const days = Number(searchParams.get('days')) || 30;

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      switch (type) {
        case 'sales': {
          const orders = await prisma.order.findMany({
            where: { createdAt: { gte: dateFrom }, status: { not: 'cancelled' } },
            select: { createdAt: true, totalAmount: true, clientType: true },
            orderBy: { createdAt: 'asc' },
          });

          // Group by date
          const daily: Record<string, { date: string; revenue: number; count: number }> = {};
          for (const o of orders) {
            const date = o.createdAt.toISOString().slice(0, 10);
            if (!daily[date]) daily[date] = { date, revenue: 0, count: 0 };
            daily[date].revenue += Number(o.totalAmount);
            daily[date].count++;
          }

          const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
          const totalOrders = orders.length;
          const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;

          return successResponse({
            daily: Object.values(daily),
            summary: { totalRevenue, totalOrders, avgCheck },
          });
        }

        case 'products': {
          const topProducts = await prisma.orderItem.groupBy({
            by: ['productId', 'productName', 'productCode'],
            _sum: { quantity: true, subtotal: true },
            _count: true,
            orderBy: { _sum: { quantity: 'desc' } },
            take: 20,
          });

          const zeroSales = await prisma.product.count({
            where: {
              isActive: true,
              orderItems: { none: { order: { createdAt: { gte: dateFrom } } } },
            },
          });

          return successResponse({ topProducts, zeroSales });
        }

        case 'clients': {
          const newUsers = await prisma.user.count({
            where: { createdAt: { gte: dateFrom } },
          });
          const totalUsers = await prisma.user.count();
          const wholesalers = await prisma.user.count({ where: { role: 'wholesaler' } });

          const topClients = await prisma.order.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: dateFrom }, status: { not: 'cancelled' }, userId: { not: null } },
            _sum: { totalAmount: true },
            _count: true,
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 10,
          });

          const clientIds = topClients.map((c) => c.userId).filter((id): id is number => id !== null);
          const clientInfo = await prisma.user.findMany({
            where: { id: { in: clientIds } },
            select: { id: true, fullName: true, email: true, companyName: true },
          });
          const clientMap = new Map(clientInfo.map((c) => [c.id, c]));

          const topClientsWithInfo = topClients.map((c) => ({
            ...c,
            client: c.userId ? clientMap.get(c.userId) || null : null,
          }));

          return successResponse({ newUsers, totalUsers, wholesalers, topClients: topClientsWithInfo });
        }

        case 'orders': {
          const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
            where: { createdAt: { gte: dateFrom } },
          });

          const deliveryCounts = await prisma.order.groupBy({
            by: ['deliveryMethod'],
            _count: true,
            where: { createdAt: { gte: dateFrom } },
          });

          const paymentCounts = await prisma.order.groupBy({
            by: ['paymentMethod'],
            _count: true,
            where: { createdAt: { gte: dateFrom } },
          });

          return successResponse({ statusCounts, deliveryCounts, paymentCounts });
        }

        case 'funnel': {
          const funnelStats = await prisma.dailyFunnelStats.findMany({
            where: { date: { gte: dateFrom } },
            orderBy: { date: 'asc' },
          });
          return successResponse(funnelStats);
        }

        default:
          return errorResponse('Невідомий тип аналітики', 400);
      }
    } catch {
      return errorResponse('Помилка завантаження аналітики', 500);
    }
  }
);

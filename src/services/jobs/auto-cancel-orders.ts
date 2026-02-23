import { prisma } from '@/lib/prisma';

const AUTO_CANCEL_HOURS = 72;

/**
 * Auto-cancel orders stuck in 'new_order' status for more than 72 hours.
 * Returns the number of cancelled orders.
 */
export async function autoCancelStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_CANCEL_HOURS * 60 * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'new_order',
      createdAt: { lt: cutoff },
    },
    select: { id: true, orderNumber: true, userId: true },
  });

  if (staleOrders.length === 0) return 0;

  for (const order of staleOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        cancelledReason: 'Автоматичне скасування: замовлення не оброблено протягом 72 годин',
        cancelledBy: 'system',
        statusHistory: {
          create: {
            oldStatus: 'new_order',
            newStatus: 'cancelled',
            changeSource: 'cron',
            comment: 'Автоматичне скасування через 72 години',
          },
        },
      },
    });

    // Notify client if they have Telegram linked
    if (order.userId) {
      import('@/services/telegram')
        .then((mod) =>
          mod.notifyClientStatusChange(
            order.userId!,
            order.orderNumber,
            'new_order',
            'cancelled'
          )
        )
        .catch(() => {});
    }
  }

  return staleOrders.length;
}

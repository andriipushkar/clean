import { prisma } from '@/lib/prisma';
import { trackParcel } from '@/services/nova-poshta';

/**
 * Auto-check delivery status for shipped orders via Nova Poshta API.
 * Updates order status to 'completed' when delivered.
 */
export async function autoTrackDeliveries(): Promise<{ checked: number; updated: number }> {
  const shippedOrders = await prisma.order.findMany({
    where: {
      status: 'shipped',
      trackingNumber: { not: null },
      deliveryMethod: 'nova_poshta',
    },
    select: { id: true, orderNumber: true, trackingNumber: true, userId: true },
    take: 50,
  });

  let updated = 0;

  for (const order of shippedOrders) {
    if (!order.trackingNumber) continue;

    try {
      const result = await trackParcel(order.trackingNumber);
      const status = result[0];
      if (!status) continue;

      const statusCode = Number(status.StatusCode);

      // StatusCode 9 = Delivered, 10 = Delivered (returned), 11 = Delivered
      if (statusCode === 9 || statusCode === 11) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            statusHistory: {
              create: {
                oldStatus: 'shipped',
                newStatus: 'completed',
                changeSource: 'cron',
                comment: `Автоматично: посилка доставлена (ТТН ${order.trackingNumber})`,
              },
            },
          },
        });

        // Notify client
        if (order.userId) {
          import('@/services/telegram')
            .then((mod) =>
              mod.notifyClientStatusChange(
                order.userId!,
                order.orderNumber,
                'shipped',
                'completed',
                order.trackingNumber
              )
            )
            .catch(() => {});
        }

        updated++;
      }
    } catch {
      // Skip this order if tracking fails
      continue;
    }
  }

  return { checked: shippedOrders.length, updated };
}

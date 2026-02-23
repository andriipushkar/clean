import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { sendCartAbandonmentEmail } from '../email-template';

export async function processAbandonedCarts(hoursThreshold = 24) {
  const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  // Find users with cart items older than threshold
  const usersWithCarts = await prisma.cartItem.groupBy({
    by: ['userId'],
    where: {
      updatedAt: { lt: thresholdDate },
    },
  });

  if (usersWithCarts.length === 0) {
    return { sent: 0, message: 'Немає покинутих кошиків' };
  }

  let sent = 0;

  for (const { userId } of usersWithCarts) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (!user?.email) continue;

      const cartItems = await prisma.cartItem.findMany({
        where: {
          userId,
          updatedAt: { lt: thresholdDate },
        },
        include: {
          product: {
            select: { name: true, priceRetail: true },
          },
        },
      });

      if (cartItems.length === 0) continue;

      await sendCartAbandonmentEmail({
        to: user.email,
        name: user.fullName,
        items: cartItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.product.priceRetail),
        })),
        cartUrl: `${env.APP_URL}/cart`,
      });
      sent++;
    } catch {
      // Continue processing other users
    }
  }

  return { sent, total: usersWithCarts.length };
}

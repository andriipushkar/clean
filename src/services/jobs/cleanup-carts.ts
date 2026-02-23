import { prisma } from '@/lib/prisma';

const STALE_CART_DAYS = 30;

/**
 * Clean up stale cart items older than 30 days.
 */
export async function cleanupStaleCarts(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_CART_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.cartItem.deleteMany({
    where: {
      addedAt: { lt: cutoff },
    },
  });

  return result.count;
}

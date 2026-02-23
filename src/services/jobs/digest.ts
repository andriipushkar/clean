import { prisma } from '@/lib/prisma';
import { sendDigestEmail } from '../email-template';

export async function processDigestEmails() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const subscribers = await prisma.subscriber.findMany({
    where: { status: 'confirmed' },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    return { sent: 0, message: 'Немає підписників' };
  }

  const newProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      createdAt: { gte: oneWeekAgo },
    },
    select: { name: true, priceRetail: true, slug: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const promoProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isPromo: true,
    },
    select: { name: true, priceRetail: true, priceRetailOld: true, slug: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  if (newProducts.length === 0 && promoProducts.length === 0) {
    return { sent: 0, message: 'Немає нових товарів чи акцій для дайджесту' };
  }

  const period = `${oneWeekAgo.toLocaleDateString('uk-UA')} — ${new Date().toLocaleDateString('uk-UA')}`;
  let sent = 0;

  for (const subscriber of subscribers) {
    try {
      await sendDigestEmail({
        to: subscriber.email,
        name: 'Шановний покупцю',
        newProducts: newProducts.map((p) => ({
          name: p.name,
          price: Number(p.priceRetail),
          slug: p.slug,
        })),
        promoProducts: promoProducts.map((p) => ({
          name: p.name,
          price: Number(p.priceRetail),
          oldPrice: Number(p.priceRetailOld || p.priceRetail),
          slug: p.slug,
        })),
        period,
      });
      sent++;
    } catch {
      // Continue sending to other subscribers
    }
  }

  return { sent, total: subscribers.length };
}

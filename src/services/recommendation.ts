import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';

const CACHE_PREFIX = 'rec:';

/**
 * Get product recommendations (manual + algorithmic).
 */
export async function getRecommendations(
  productId: number,
  limit = 8
): Promise<{
  id: number;
  name: string;
  slug: string;
  code: string;
  priceRetail: unknown;
  imagePath: string | null;
  isPromo: boolean;
  images: { pathThumbnail: string | null }[];
}[]> {
  const cacheKey = `${CACHE_PREFIX}${productId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 1. Manual recommendations first
  const manual = await prisma.productRecommendation.findMany({
    where: { productId, recommendationType: 'manual' },
    orderBy: { score: 'desc' },
    take: limit,
    select: {
      recommendedProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          priceRetail: true,
          imagePath: true,
          isPromo: true,
          isActive: true,
          images: {
            select: { pathThumbnail: true },
            where: { isMain: true },
            take: 1,
          },
        },
      },
    },
  });

  const manualProducts = manual
    .map((r) => r.recommendedProduct)
    .filter((p) => p.isActive);

  if (manualProducts.length >= limit) {
    const result = manualProducts.slice(0, limit);
    await redis.setex(cacheKey, CACHE_TTL.MEDIUM, JSON.stringify(result));
    return result;
  }

  // 2. Fill with "bought_together" and "similar"
  const existingIds = manualProducts.map((p) => p.id);
  const auto = await prisma.productRecommendation.findMany({
    where: {
      productId,
      recommendationType: { in: ['bought_together', 'similar'] },
      recommendedProductId: { notIn: [...existingIds, productId] },
    },
    orderBy: { score: 'desc' },
    take: limit - manualProducts.length,
    select: {
      recommendedProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          priceRetail: true,
          imagePath: true,
          isPromo: true,
          isActive: true,
          images: {
            select: { pathThumbnail: true },
            where: { isMain: true },
            take: 1,
          },
        },
      },
    },
  });

  const autoProducts = auto
    .map((r) => r.recommendedProduct)
    .filter((p) => p.isActive);

  const combined = [...manualProducts, ...autoProducts];

  // 3. If still not enough, fill with same-category products
  if (combined.length < limit) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (product?.categoryId) {
      const allIds = [...combined.map((p) => p.id), productId];
      const categoryProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          id: { notIn: allIds },
        },
        orderBy: { ordersCount: 'desc' },
        take: limit - combined.length,
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          priceRetail: true,
          imagePath: true,
          isPromo: true,
          isActive: true,
          images: {
            select: { pathThumbnail: true },
            where: { isMain: true },
            take: 1,
          },
        },
      });
      combined.push(...categoryProducts);
    }
  }

  const result = combined.slice(0, limit);
  await redis.setex(cacheKey, CACHE_TTL.MEDIUM, JSON.stringify(result));
  return result;
}

/**
 * Build "bought_together" recommendations from order history.
 * Should run as a periodic job.
 */
export async function buildBoughtTogetherRecommendations(): Promise<number> {
  // Get recent orders with 2+ items
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['completed', 'shipped', 'paid'] },
      itemsCount: { gte: 2 },
    },
    select: {
      items: { select: { productId: true } },
    },
    take: 1000,
    orderBy: { createdAt: 'desc' },
  });

  const pairCounts = new Map<string, number>();

  for (const order of orders) {
    const ids = order.items.map((i) => i.productId);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join(':');
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  let created = 0;
  for (const [key, count] of pairCounts) {
    if (count < 2) continue; // min 2 co-occurrences
    const [a, b] = key.split(':').map(Number);

    // Upsert both directions
    for (const [from, to] of [[a, b], [b, a]]) {
      const existing = await prisma.productRecommendation.findFirst({
        where: {
          productId: from,
          recommendedProductId: to,
          recommendationType: 'bought_together',
        },
      });

      if (existing) {
        await prisma.productRecommendation.update({
          where: { id: existing.id },
          data: { score: count },
        });
      } else {
        await prisma.productRecommendation.create({
          data: {
            productId: from,
            recommendedProductId: to,
            recommendationType: 'bought_together',
            score: count,
          },
        });
      }
      created++;
    }
  }

  return created;
}

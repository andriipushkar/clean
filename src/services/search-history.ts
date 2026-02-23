import { prisma } from '@/lib/prisma';

export async function saveSearch(userId: number, query: string, resultsCount: number) {
  return prisma.searchHistory.create({
    data: {
      userId,
      query: query.slice(0, 255),
      resultsCount,
    },
  });
}

export async function getSearchHistory(userId: number, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        query: true,
        resultsCount: true,
        clickedProductId: true,
        createdAt: true,
      },
    }),
    prisma.searchHistory.count({ where: { userId } }),
  ]);

  return { items, total };
}

export async function deleteSearchEntry(id: number, userId: number) {
  return prisma.searchHistory.deleteMany({
    where: { id, userId },
  });
}

export async function clearSearchHistory(userId: number) {
  return prisma.searchHistory.deleteMany({
    where: { userId },
  });
}

export async function trackClick(id: number, userId: number, productId: number) {
  return prisma.searchHistory.updateMany({
    where: { id, userId },
    data: { clickedProductId: productId },
  });
}

/**
 * Повертає останні N унікальних пошукових запитів користувача.
 * Використовується для випадаючого списку історії пошуку.
 */
export async function getRecentUniqueQueries(userId: number, limit = 5) {
  const entries = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      query: true,
      createdAt: true,
    },
    take: limit * 3, // fetch extra to account for duplicates
  });

  const seen = new Set<string>();
  const unique: { id: number; query: string; createdAt: Date }[] = [];

  for (const entry of entries) {
    const normalized = entry.query.trim().toLowerCase();
    if (!seen.has(normalized) && unique.length < limit) {
      seen.add(normalized);
      unique.push(entry);
    }
  }

  return unique;
}

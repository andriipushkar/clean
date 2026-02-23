import { prisma } from '@/lib/prisma';

export class FaqError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'FaqError';
  }
}

export async function getPublishedFaq() {
  const items = await prisma.faqItem.findMany({
    where: { isPublished: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  // Group by category
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return grouped;
}

export async function getFaqCategories() {
  const items = await prisma.faqItem.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return items.map((i) => i.category);
}

export async function searchFaq(query: string) {
  return prisma.faqItem.findMany({
    where: {
      isPublished: true,
      OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { clickCount: 'desc' },
  });
}

export async function incrementFaqClick(id: number) {
  await prisma.faqItem.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  });
}

export async function getAllFaq() {
  return prisma.faqItem.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
}

export async function createFaqItem(data: {
  category: string;
  question: string;
  answer: string;
  sortOrder?: number;
  isPublished?: boolean;
}) {
  return prisma.faqItem.create({
    data: {
      category: data.category,
      question: data.question,
      answer: data.answer,
      sortOrder: data.sortOrder ?? 0,
      isPublished: data.isPublished ?? true,
    },
  });
}

export async function updateFaqItem(
  id: number,
  data: {
    category?: string;
    question?: string;
    answer?: string;
    sortOrder?: number;
    isPublished?: boolean;
  }
) {
  const item = await prisma.faqItem.findUnique({ where: { id } });
  if (!item) throw new FaqError('Питання не знайдено', 404);

  return prisma.faqItem.update({ where: { id }, data });
}

export async function deleteFaqItem(id: number) {
  const item = await prisma.faqItem.findUnique({ where: { id } });
  if (!item) throw new FaqError('Питання не знайдено', 404);

  await prisma.faqItem.delete({ where: { id } });
}

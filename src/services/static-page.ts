import { prisma } from '@/lib/prisma';
import { createSlug } from '@/utils/slug';

export class StaticPageError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'StaticPageError';
  }
}

export async function getPublishedPages() {
  return prisma.staticPage.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, title: true, sortOrder: true, updatedAt: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getPageBySlug(slug: string) {
  return prisma.staticPage.findUnique({
    where: { slug, isPublished: true },
  });
}

export async function getAllPages() {
  return prisma.staticPage.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createPage(data: {
  title: string;
  slug?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished?: boolean;
  sortOrder?: number;
  updatedBy?: number;
}) {
  const slug = data.slug || createSlug(data.title);

  const existing = await prisma.staticPage.findUnique({ where: { slug } });
  if (existing) {
    throw new StaticPageError('Сторінка з таким slug вже існує', 409);
  }

  return prisma.staticPage.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      isPublished: data.isPublished ?? true,
      sortOrder: data.sortOrder ?? 0,
      updatedBy: data.updatedBy,
    },
  });
}

export async function updatePage(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    seoTitle?: string;
    seoDescription?: string;
    isPublished?: boolean;
    sortOrder?: number;
    updatedBy?: number;
  }
) {
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) throw new StaticPageError('Сторінку не знайдено', 404);

  if (data.slug && data.slug !== page.slug) {
    const existing = await prisma.staticPage.findUnique({ where: { slug: data.slug } });
    if (existing) throw new StaticPageError('Сторінка з таким slug вже існує', 409);
  }

  return prisma.staticPage.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
    },
  });
}

export async function deletePage(id: number) {
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) throw new StaticPageError('Сторінку не знайдено', 404);

  await prisma.staticPage.delete({ where: { id } });
}

import { prisma } from '@/lib/prisma';

export class SeoTemplateError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SeoTemplateError';
  }
}

interface SeoTemplateInput {
  entityType: string;
  scope: string;
  titleTemplate: string;
  descriptionTemplate: string;
  altTemplate?: string;
  categoryId?: number;
}

export async function getSeoTemplates() {
  return prisma.seoTemplate.findMany({
    orderBy: { entityType: 'asc' },
  });
}

export async function getSeoTemplateByEntity(entityType: string, categoryId?: number) {
  return prisma.seoTemplate.findFirst({
    where: {
      entityType,
      ...(categoryId ? { categoryId } : { categoryId: null }),
    },
  });
}

export async function createSeoTemplate(data: SeoTemplateInput) {
  return prisma.seoTemplate.create({
    data: {
      entityType: data.entityType,
      scope: data.scope || 'global',
      titleTemplate: data.titleTemplate,
      descriptionTemplate: data.descriptionTemplate,
      altTemplate: data.altTemplate,
      categoryId: data.categoryId,
    },
  });
}

export async function updateSeoTemplate(id: number, data: Partial<SeoTemplateInput>) {
  const template = await prisma.seoTemplate.findUnique({ where: { id } });
  if (!template) throw new SeoTemplateError('Шаблон не знайдено', 404);

  return prisma.seoTemplate.update({
    where: { id },
    data,
  });
}

export async function deleteSeoTemplate(id: number) {
  const template = await prisma.seoTemplate.findUnique({ where: { id } });
  if (!template) throw new SeoTemplateError('Шаблон не знайдено', 404);

  return prisma.seoTemplate.delete({ where: { id } });
}

/**
 * Applies SEO template variables for a product
 * Variables: {name}, {code}, {category}, {price}, {brand}
 */
export function applyProductTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export async function generateProductSeo(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true, id: true } },
      content: { select: { id: true, seoTitle: true, seoDescription: true } },
    },
  });

  if (!product) throw new SeoTemplateError('Товар не знайдено', 404);

  // Try category-specific template first, then general product template
  const template =
    (await getSeoTemplateByEntity('product', product.category?.id)) ||
    (await getSeoTemplateByEntity('product'));

  if (!template) return null;

  const vars: Record<string, string> = {
    name: product.name,
    code: product.code,
    category: product.category?.name || '',
    price: Number(product.priceRetail).toFixed(2),
  };

  return {
    seoTitle: applyProductTemplate(template.titleTemplate, vars),
    seoDescription: applyProductTemplate(template.descriptionTemplate, vars),
    imageAlt: template.altTemplate ? applyProductTemplate(template.altTemplate, vars) : undefined,
  };
}

export async function bulkGenerateProductSeo() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { content: null },
        { content: { seoTitle: null } },
      ],
    },
    include: { category: { select: { name: true, id: true } } },
    take: 100,
  });

  let updated = 0;

  for (const product of products) {
    const template =
      (await getSeoTemplateByEntity('product', product.category?.id)) ||
      (await getSeoTemplateByEntity('product'));

    if (!template) continue;

    const vars: Record<string, string> = {
      name: product.name,
      code: product.code,
      category: product.category?.name || '',
      price: Number(product.priceRetail).toFixed(2),
    };

    const seoTitle = applyProductTemplate(template.titleTemplate, vars);
    const seoDescription = applyProductTemplate(template.descriptionTemplate, vars);

    await prisma.productContent.upsert({
      where: { productId: product.id },
      update: { seoTitle, seoDescription },
      create: { productId: product.id, seoTitle, seoDescription },
    });

    updated++;
  }

  return { updated, total: products.length };
}

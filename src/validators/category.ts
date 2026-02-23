import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Назва категорії має містити щонайменше 2 символи')
    .max(100, 'Назва категорії не може перевищувати 100 символів'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug може містити лише малі літери, цифри та дефіс')
    .max(100)
    .optional(),
  description: z.string().max(2000).optional(),
  iconPath: z.string().max(255).optional(),
  coverImage: z.string().max(255).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

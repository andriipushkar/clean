import { z } from 'zod';

export const personalPriceFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type PersonalPriceFilterInput = z.infer<typeof personalPriceFilterSchema>;

export const createPersonalPriceSchema = z
  .object({
    userId: z.number().int().positive(),
    productId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    fixedPrice: z.number().min(0).optional(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
  })
  .refine(
    (data) => data.productId || data.categoryId,
    { message: 'Потрібен productId або categoryId', path: ['productId'] }
  )
  .refine(
    (data) => data.discountPercent !== undefined || data.fixedPrice !== undefined,
    { message: 'Потрібен discountPercent або fixedPrice', path: ['discountPercent'] }
  );

export type CreatePersonalPriceInput = z.infer<typeof createPersonalPriceSchema>;

export const updatePersonalPriceSchema = z.object({
  discountPercent: z.number().min(0).max(100).optional(),
  fixedPrice: z.number().min(0).optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

export type UpdatePersonalPriceInput = z.infer<typeof updatePersonalPriceSchema>;

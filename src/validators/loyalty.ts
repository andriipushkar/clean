import { z } from 'zod';

export const adjustPointsSchema = z.object({
  userId: z.number().int().positive(),
  type: z.enum(['manual_add', 'manual_deduct']),
  points: z.number().int().positive(),
  description: z.string().min(1).max(500),
});

export type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;

export const updateLoyaltyLevelSchema = z.object({
  name: z.string().min(1),
  minSpent: z.number().min(0),
  pointsMultiplier: z.number().min(0).default(1),
  discountPercent: z.number().min(0).max(100).default(0),
  benefits: z.record(z.string(), z.unknown()).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export type UpdateLoyaltyLevelInput = z.infer<typeof updateLoyaltyLevelSchema>;

export const loyaltyTransactionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoyaltyTransactionFilterInput = z.infer<typeof loyaltyTransactionFilterSchema>;

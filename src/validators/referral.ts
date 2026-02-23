import { z } from 'zod';

export const referralFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['registered', 'first_order', 'bonus_granted']).optional(),
  referrerId: z.coerce.number().int().positive().optional(),
});

export type ReferralFilterInput = z.infer<typeof referralFilterSchema>;

export const grantBonusSchema = z.object({
  bonusType: z.enum(['discount', 'cashback', 'points']),
  bonusValue: z.number().positive(),
});

export type GrantBonusInput = z.infer<typeof grantBonusSchema>;

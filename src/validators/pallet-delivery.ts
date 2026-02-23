import { z } from 'zod';

export const palletConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minWeightKg: z.number().min(0).default(100),
  maxWeightKg: z.number().min(0).default(5000),
  basePrice: z.number().min(0).default(1500),
  pricePerKg: z.number().min(0).default(3),
  regions: z.array(
    z.object({
      name: z.string().min(1),
      multiplier: z.number().min(0.1).max(10).default(1),
    })
  ).default([]),
  freeDeliveryThreshold: z.number().min(0).default(0),
  estimatedDays: z.string().default('3-5'),
});

export type PalletConfig = z.infer<typeof palletConfigSchema>;

export const calculatePalletCostSchema = z.object({
  weightKg: z.number().min(1),
  region: z.string().optional(),
});

export type CalculatePalletCostInput = z.infer<typeof calculatePalletCostSchema>;

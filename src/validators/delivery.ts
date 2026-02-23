import { z } from 'zod';

export const deliveryEstimateSchema = z.object({
  method: z.enum(['nova_poshta', 'ukrposhta']),
  city: z.string().optional(),
  total: z.coerce.number().min(0),
  weight: z.coerce.number().min(0.1).default(1),
});

export type DeliveryEstimateInput = z.infer<typeof deliveryEstimateSchema>;

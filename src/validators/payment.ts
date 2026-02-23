import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  provider: z.enum(['liqpay', 'monobank']),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

import { z } from 'zod';

export const createShipmentSchema = z.object({
  senderName: z.string().min(2).max(100),
  senderPhone: z.string().min(10).max(20),
  senderAddress: z.string().min(5).max(255),
  senderPostcode: z.string().min(5).max(10),
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().min(10).max(20),
  recipientAddress: z.string().min(5).max(255),
  recipientPostcode: z.string().min(5).max(10),
  weight: z.number().min(0.01).max(30000),
  length: z.number().min(1).max(2000),
  width: z.number().min(1).max(2000),
  height: z.number().min(1).max(2000),
  declaredValue: z.number().min(0),
  description: z.string().max(255).optional(),
  deliveryType: z.enum(['W2W', 'W2D', 'D2W', 'D2D']).optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

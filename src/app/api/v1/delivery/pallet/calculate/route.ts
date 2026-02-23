import { NextRequest } from 'next/server';
import { calculatePalletDeliveryCost, PalletDeliveryError } from '@/services/pallet-delivery';
import { calculatePalletCostSchema } from '@/validators/pallet-delivery';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = calculatePalletCostSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невірні дані', 400);
    }

    const result = await calculatePalletDeliveryCost(parsed.data.weightKg, parsed.data.region);
    return successResponse(result);
  } catch (error) {
    if (error instanceof PalletDeliveryError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Помилка розрахунку вартості доставки', 500);
  }
}

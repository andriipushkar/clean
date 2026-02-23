import { NextRequest } from 'next/server';
import { getPromoProducts } from '@/services/product';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 10;
    const products = await getPromoProducts(Math.min(limit, 50));
    return successResponse(products);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

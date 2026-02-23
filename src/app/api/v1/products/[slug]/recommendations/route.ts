import { NextRequest } from 'next/server';
import { getRecommendations } from '@/services/recommendation';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const productId = Number(slug);
    if (!productId || isNaN(productId)) {
      return errorResponse('Невалідний ID товару', 400);
    }

    const recommendations = await getRecommendations(productId);
    return successResponse(recommendations);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

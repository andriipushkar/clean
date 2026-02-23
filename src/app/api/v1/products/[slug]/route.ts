import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/middleware/auth';
import { getProductBySlug } from '@/services/product';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withOptionalAuth(async (
  _request: NextRequest,
  { user, params }
) => {
  try {
    const { slug } = await params!;
    const product = await getProductBySlug(slug, user?.id ?? null);

    if (!product) {
      return errorResponse('Товар не знайдено', 404);
    }

    return successResponse(product);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

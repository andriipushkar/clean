import { NextRequest } from 'next/server';
import { getCategoryBySlug } from '@/services/category';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

    if (!category) {
      return errorResponse('Категорію не знайдено', 404);
    }

    return successResponse(category);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

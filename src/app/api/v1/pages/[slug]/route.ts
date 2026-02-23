import { NextRequest } from 'next/server';
import { getPageBySlug } from '@/services/static-page';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await getPageBySlug(slug);
    if (!page) return errorResponse('Сторінку не знайдено', 404);
    return successResponse(page);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

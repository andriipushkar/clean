import { NextRequest } from 'next/server';
import { getCategories } from '@/services/category';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const includeHidden = request.nextUrl.searchParams.get('includeHidden') === 'true';
    const categories = await getCategories({ includeHidden });
    return successResponse(categories);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

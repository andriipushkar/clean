import { getPublishedPages } from '@/services/static-page';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET() {
  try {
    const pages = await getPublishedPages();
    return successResponse(pages);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

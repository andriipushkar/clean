import { getPublishedFaq } from '@/services/faq';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET() {
  try {
    const faq = await getPublishedFaq();
    return successResponse(faq);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

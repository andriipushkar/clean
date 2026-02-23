import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/utils/api-response';
import { generateAnalyticsPdf } from '@/services/analytics-pdf';

export const POST = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { reportType, days = 30 } = body;

    const validTypes = ['stock', 'price', 'channels', 'geography', 'ltv', 'segments', 'summary'];
    if (!validTypes.includes(reportType)) {
      return errorResponse(`Невірний тип звіту. Допустимі: ${validTypes.join(', ')}`, 400);
    }

    const pdfUrl = await generateAnalyticsPdf(reportType, days);
    return successResponse({ url: pdfUrl });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

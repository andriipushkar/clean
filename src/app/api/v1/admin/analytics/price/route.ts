import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getPriceAnalytics } from '@/services/analytics-reports';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const days = Number(request.nextUrl.searchParams.get('days')) || 30;
    const data = await getPriceAnalytics(days);
    return successResponse(data);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

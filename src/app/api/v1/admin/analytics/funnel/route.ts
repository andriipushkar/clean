import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getConversionFunnel } from '@/services/analytics';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 30));
    const data = await getConversionFunnel(days);
    return successResponse(data);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

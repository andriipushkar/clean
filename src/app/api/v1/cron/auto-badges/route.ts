import { NextRequest } from 'next/server';
import { autoAssignBadges } from '@/services/badge';
import { successResponse, errorResponse } from '@/utils/api-response';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.APP_SECRET}`) {
      return errorResponse('Unauthorized', 401);
    }

    const result = await autoAssignBadges();
    return successResponse(result);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

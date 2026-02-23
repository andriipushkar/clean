import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getLoyaltyLevels, updateLoyaltySettings } from '@/services/loyalty';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin')(async () => {
  try {
    const levels = await getLoyaltyLevels();
    return successResponse(levels);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const PUT = withRole('admin')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!Array.isArray(body.levels)) {
      return errorResponse('levels must be an array', 400);
    }

    const levels = await updateLoyaltySettings(body.levels);
    return successResponse(levels);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

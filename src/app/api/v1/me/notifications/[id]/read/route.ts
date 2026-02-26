import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { markAsRead } from '@/services/notification';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    await markAsRead(numId, user.id);
    return successResponse({ success: true });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

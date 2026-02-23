import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getUnreadCount } from '@/services/notification';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const count = await getUnreadCount(user.id);
    return successResponse({ count });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

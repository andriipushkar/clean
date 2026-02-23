import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getRecentlyViewed, addRecentlyViewed, clearRecentlyViewed } from '@/services/recently-viewed';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 15;
    const items = await getRecentlyViewed(user.id, Math.min(limit, 30));
    return successResponse(items);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { productId } = await request.json();
    if (!productId || typeof productId !== 'number') {
      return errorResponse('productId обов\'язковий', 400);
    }
    await addRecentlyViewed(user.id, productId);
    return successResponse({ message: 'ok' });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withAuth(async (_request: NextRequest, { user }) => {
  try {
    await clearRecentlyViewed(user.id);
    return successResponse({ message: 'Історію очищено' });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

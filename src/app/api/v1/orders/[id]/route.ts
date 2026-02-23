import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getOrderById } from '@/services/order';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const order = await getOrderById(Number(id), user.id);
    if (!order) {
      return errorResponse('Замовлення не знайдено', 404);
    }
    return successResponse(order);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

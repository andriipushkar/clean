import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { updateOrderStatus, OrderError } from '@/services/order';
import { successResponse, errorResponse } from '@/utils/api-response';

// Client can only cancel their own orders
export const PUT = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const body = await request.json();

    if (body.status !== 'cancelled') {
      return errorResponse('Ви можете лише скасувати замовлення', 403);
    }

    const order = await updateOrderStatus(
      numId,
      'cancelled',
      user.id,
      'client_action',
      body.comment
    );

    return successResponse(order);
  } catch (error) {
    if (error instanceof OrderError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updateOrderStatus, OrderError } from '@/services/order';
import { updateOrderStatusSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const order = await updateOrderStatus(
      Number(id),
      parsed.data.status,
      user.id,
      'manager',
      parsed.data.comment
    );

    return successResponse(order);
  } catch (error) {
    if (error instanceof OrderError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

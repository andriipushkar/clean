import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { approveWholesale, rejectWholesale, UserError } from '@/services/user';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const body = await request.json();

    if (body.action === 'approve') {
      const result = await approveWholesale(Number(id), user.id);
      return successResponse(result);
    }

    if (body.action === 'reject') {
      const result = await rejectWholesale(Number(id));
      return successResponse(result);
    }

    return errorResponse('Невідома дія. Використовуйте approve або reject', 400);
  } catch (error) {
    if (error instanceof UserError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

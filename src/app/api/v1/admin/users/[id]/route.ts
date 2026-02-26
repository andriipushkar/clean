import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getUserById, updateUserRole, UserError } from '@/services/user';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (_request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const user = await getUserById(numId);
    if (!user) {
      return errorResponse('Користувача не знайдено', 404);
    }
    return successResponse(user);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const PUT = withRole('admin')(async (request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const body = await request.json();

    if (body.role) {
      const user = await updateUserRole(numId, body.role);
      return successResponse(user);
    }

    return errorResponse('Не вказано поле для оновлення', 400);
  } catch (error) {
    if (error instanceof UserError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

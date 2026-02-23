import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { deleteAccount, AccountError } from '@/services/account';
import { successResponse, errorResponse } from '@/utils/api-response';

export const DELETE = withAuth(async (_request: NextRequest, { user }) => {
  try {
    await deleteAccount(user.id);
    return successResponse({ message: 'Акаунт видалено' });
  } catch (error) {
    if (error instanceof AccountError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

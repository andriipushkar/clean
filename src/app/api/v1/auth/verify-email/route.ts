import { NextRequest } from 'next/server';
import { verifyEmail, sendEmailVerification } from '@/services/verification';
import { withAuth } from '@/middleware/auth';
import { AuthError } from '@/services/auth-errors';
import { successResponse, errorResponse } from '@/utils/api-response';

// POST /api/v1/auth/verify-email — verify with token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return errorResponse('Токен підтвердження не надано', 400);
    }

    await verifyEmail(token);
    return successResponse({ message: 'Email успішно підтверджено' });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

// PUT /api/v1/auth/verify-email — resend verification (auth required)
export const PUT = withAuth(async (_request, { user }) => {
  try {
    await sendEmailVerification(user.id);
    return successResponse({ message: 'Лист підтвердження надіслано повторно' });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

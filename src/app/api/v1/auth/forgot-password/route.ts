import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestPasswordReset } from '@/services/verification';
import { successResponse, errorResponse } from '@/utils/api-response';

const schema = z.object({
  email: z.string().email('Невірний формат email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
    }

    await requestPasswordReset(parsed.data.email);

    // Always return success to prevent email enumeration
    return successResponse({
      message: 'Якщо акаунт з таким email існує, на нього буде надіслано інструкції для відновлення пароля',
    });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/middleware/auth';
import { linkTelegramAccount } from '@/services/telegram';
import { successResponse, errorResponse } from '@/utils/api-response';

const linkSchema = z.object({
  token: z.string().min(1),
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Токен не надано', 422);
    }

    const linked = await linkTelegramAccount(user.id, parsed.data.token);
    if (!linked) {
      return errorResponse('Невалідний або прострочений токен', 400);
    }

    return successResponse({ message: 'Telegram акаунт прив\'язано' });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

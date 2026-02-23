import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/utils/api-response';
import { subscribePush, getVapidPublicKey } from '@/services/push';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse('Невалідна підписка: endpoint, keys.p256dh, keys.auth обов\'язкові', 400);
    }

    await subscribePush(user.id, { endpoint, keys });

    return successResponse({ subscribed: true });
  } catch {
    return errorResponse('Помилка підписки на push-сповіщення', 500);
  }
});

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return errorResponse('VAPID не налаштовано', 503);
  }
  return successResponse({ publicKey });
}

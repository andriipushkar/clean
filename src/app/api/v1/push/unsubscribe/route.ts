import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/utils/api-response';
import { unsubscribePush } from '@/services/push';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return errorResponse('Endpoint обов\'язковий', 400);
    }

    await unsubscribePush(endpoint);

    return successResponse({ unsubscribed: true });
  } catch {
    return errorResponse('Помилка відписки від push-сповіщень', 500);
  }
});

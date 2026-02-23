import { NextRequest } from 'next/server';
import { subscribeSchema } from '@/validators/feedback';
import { subscribe, confirmSubscription, unsubscribeByEmail, SubscriberError } from '@/services/subscriber';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const result = await subscribe(parsed.data.email, parsed.data.source);
    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof SubscriberError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const action = request.nextUrl.searchParams.get('action');

  if (!token) {
    return errorResponse('Токен не надано', 400);
  }

  try {
    if (action === 'unsubscribe') {
      const result = await unsubscribeByEmail(token);
      return successResponse(result);
    }

    const result = await confirmSubscription(token);
    return successResponse(result);
  } catch (error) {
    if (error instanceof SubscriberError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

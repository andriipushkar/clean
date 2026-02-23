import { NextRequest } from 'next/server';
import { autoCancelStaleOrders } from '@/services/jobs/auto-cancel-orders';
import { successResponse, errorResponse } from '@/utils/api-response';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${env.APP_SECRET}`;

    if (authHeader !== expectedToken) {
      return errorResponse('Unauthorized', 401);
    }

    const cancelledCount = await autoCancelStaleOrders();
    return successResponse({ cancelledCount, message: `Скасовано ${cancelledCount} замовлень` });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}

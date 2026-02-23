import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { processAbandonedCarts } from '@/services/jobs/cart-abandonment';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('admin')(async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => ({}));
    const hours = Number(body.hoursThreshold) || 24;
    const result = await processAbandonedCarts(hours);
    return successResponse(result);
  } catch {
    return errorResponse('Помилка обробки покинутих кошиків', 500);
  }
});

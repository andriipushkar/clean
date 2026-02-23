import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getAllOrders } from '@/services/order';
import { orderFilterSchema } from '@/validators/order';
import { errorResponse, paginatedResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = orderFilterSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { orders, total } = await getAllOrders(parsed.data);
    return paginatedResponse(orders, total, parsed.data.page, parsed.data.limit);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

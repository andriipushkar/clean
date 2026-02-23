import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getTransactionHistory } from '@/services/loyalty';
import { loyaltyTransactionFilterSchema } from '@/validators/loyalty';
import { errorResponse, paginatedResponse } from '@/utils/api-response';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = loyaltyTransactionFilterSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { items, total } = await getTransactionHistory(user.id, parsed.data.page, parsed.data.limit);
    return paginatedResponse(items, total, parsed.data.page, parsed.data.limit);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

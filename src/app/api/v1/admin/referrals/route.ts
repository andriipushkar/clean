import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getAllReferrals } from '@/services/referral';
import { referralFilterSchema } from '@/validators/referral';
import { errorResponse, paginatedResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = referralFilterSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { items, total } = await getAllReferrals(parsed.data);
    return paginatedResponse(items, total, parsed.data.page, parsed.data.limit);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

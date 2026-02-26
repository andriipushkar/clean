import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { grantReferralBonus, ReferralError } from '@/services/referral';
import { grantBonusSchema } from '@/validators/referral';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('admin', 'manager')(async (request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const body = await request.json();
    const parsed = grantBonusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const result = await grantReferralBonus(numId, parsed.data);
    return successResponse(result);
  } catch (error) {
    if (error instanceof ReferralError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

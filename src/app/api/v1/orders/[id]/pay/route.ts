import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { initiatePayment, PaymentError } from '@/services/payment';
import { initiatePaymentSchema } from '@/validators/payment';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withAuth(async (request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json();
    const parsed = initiatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const result = await initiatePayment(orderId, parsed.data.provider);
    return successResponse(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

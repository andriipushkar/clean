import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { createProductSchema } from '@/validators/product';
import { createProduct, ProductError } from '@/services/product';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('manager', 'admin')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Невалідні дані';
      return errorResponse(firstError, 422);
    }

    const product = await createProduct(parsed.data);
    return successResponse(product, 201);
  } catch (error) {
    if (error instanceof ProductError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
